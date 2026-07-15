"""Importa tbl_vida_laboral.xlsx (Access) a public.historiales_laborales.

Estrategia: UPSERT por `id`, nunca borrado. Motivo: la tabla tiene datos que el
Excel no conoce y que se perderian con un reemplazo total:
  - 25 filas creadas desde la app (24 de ellas el 13/07/2026) que no estan en el Excel.
  - enviado/gestionado/tramitado, flags de flujo de trabajo que el Excel no trae y que
    5.000 filas tienen a true. El payload NO los incluye, asi que el upsert los respeta
    (PostgREST solo actualiza las columnas enviadas).

Rarezas del xlsx de origen (por eso se lee el XML crudo y no con openpyxl):
  - El export marca columnas numericas como t="b" (booleano). openpyxl casca al hacer
    bool(int('6877.19')) y, cuando no casca, convierte personal_id=1462 en True.
    Aqui el tipo se decide por el nombre de la columna, no por lo que declare el fichero.
  - El fichero alterna entre inlineStr y sharedStrings segun como se guarde; se soportan ambos.
  - fecha_alta/fecha_baja/dias_cot son seriales de Excel. dias_cot ademas viene con
    formato de fecha: es un numero de dias, no una fecha.
  - Los flotantes arrastran ruido de float32 (0.100000001490116); se redondean a la
    precision de la columna destino.

Reglas de transformacion:
  - tipo_contrato en (1, 3, 4, 64) -> contrato_laboral_id = NULL. Esos ids no existen en
    historiales_laborales_contratos (van del 94 al 135) y la FK esta validada en produccion,
    asi que el insert fallaria. Son 18 filas, todas antiguas; la tabla ya las tiene a NULL.
  - puesto_id 21 y 22 -> 2 (Recepcion/Cons/Aux/Inf). No existen en public.puestos; se sigue
    el mismo remapeo que ya aplica supabase/tables/historiales_laborales.sql.
  - coeficiente_temporalidad -> coeficiente_temporalidad_miles. Fraccion (<=10) x1000;
    si es >10 se asume que ya viene en milesimos. Mismo criterio que el ALTER de la tabla.
    Ojo: el trigger set_historiales_laborales_updated_at lo recalcula como
    round(jornada / jornada_maxima * 1000) cuando ambas jornadas existen (1.530 filas),
    y ahi manda el trigger.
  - dias_cot -> dias_periodo. El mismo trigger lo recalcula como (baja - alta) + 1
    (dias naturales inclusive) si hay alta y baja.
  - Las 9 filas de PRESERVAR_COTIZACION conservan las columnas Dto_* que ya tiene Supabase
    (regimenes distintos del estandar); el payload de esas filas omite esas 4 columnas.

Guarda de seguridad: si Dto_Cot_comunes viene >= 0.1 el script aborta. El tipo real por
contingencias comunes es el 4,70 % (0.047); un 0.47 es un cero perdido y meteria un error
de x10 en las 5.394 filas.

IMPORTANTE: el import escribe ids explicitos y eso NO avanza la secuencia de la tabla, asi
que al terminar hay que reposicionarla o la siguiente alta desde la app falla con clave
duplicada. El script lo recuerda al final; la sentencia es:

  select setval(
    pg_get_serial_sequence('public.historiales_laborales', 'id'),
    (select max(id) from public.historiales_laborales),
    true
  );

Uso:
  python scripts/import_vida_laboral.py --dry-run
  python scripts/import_vida_laboral.py --dry-run --limit 50
  python scripts/import_vida_laboral.py --service-role-key ...
  (o con SUPABASE_SERVICE_ROLE_KEY en el entorno)
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

DEFAULT_SOURCE_PATH = Path(r"C:\Users\Jr\OneDrive\JR\Tablas maestras\tbl_vida_laboral.xlsx")
DEFAULT_SUPABASE_URL = "https://epbtoarkinvgcaewbtvs.supabase.co"
DEFAULT_BATCH_SIZE = 1000

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
# Excel cuenta los dias desde el 30/12/1899 por su bug de 1900 bisiesto.
EXCEL_EPOCH = datetime.date(1899, 12, 30)

# Cabecera del Excel -> columna en public.historiales_laborales.
COLUMN_MAP = {
    "Id": "id",
    "activa": "activo",
    "personal_id": "personal_id",
    "empresa_id": "empresa_id",
    "Jornada": "jornada",
    "Jornada_max": "jornada_maxima",
    "tipo_contrato": "contrato_laboral_id",
    "vida_laboral_pagos_id": "modalidad_pago_id",
    "fecha_alta": "fecha_alta",
    "fecha_baja": "fecha_baja",
    "dias_cot": "dias_periodo",
    "puesto_id": "puesto_id",
    "coeficiente_temporalidad": "coeficiente_temporalidad_miles",
    "vida_laboral_contratacion_id": "tipo_contratacion_id",
    "vida_laboral_baja_id": "motivo_baja_id",
    "horarios": "horarios",
    "observaciones": "observaciones",
    "01_Salario_JC": "salario_jornada_completa",
    "67_HC": "importe_horas_complementarias",
    "11_have_complemento_movilidad": "tiene_complemento_movilidad",
    "65_have_Complemento_dedicacion": "tiene_complemento_dedicacion",
    "398_have_plus_transporte": "tiene_plus_transporte",
    "53_have_nocturnidad": "tiene_nocturnidad",
    "04_have_antiguedad": "tiene_antiguedad",
    "18_have_complemento": "tiene_complemento",
    "18_complemento": "complemento",
    "notas": "notas",
    "grupo_cotizacion": "grupo_cotizacion",
    "MOVIMIENTO": "movimiento",
    "puestos": "puesto_texto",
    "Dto_Cot_comunes": "cotizacion_comunes_pct",
    "Dto_mei": "cotizacion_mei_pct",
    "Dto_Cot_formacion": "cotizacion_formacion_pct",
    "Dto_Cot_Desempleo": "cotizacion_desempleo_pct",
    "lenguaje_inclusivo": "lenguaje_inclusivo",
}

BOOL_COLUMNS = {
    "activo", "tiene_complemento_movilidad", "tiene_complemento_dedicacion",
    "tiene_plus_transporte", "tiene_nocturnidad", "tiene_antiguedad",
    "tiene_complemento", "lenguaje_inclusivo",
}
INT_COLUMNS = {
    "id", "personal_id", "empresa_id", "contrato_laboral_id", "modalidad_pago_id",
    "dias_periodo", "puesto_id", "tipo_contratacion_id", "motivo_baja_id",
    "grupo_cotizacion",
}
DATE_COLUMNS = {"fecha_alta", "fecha_baja"}
TEXT_COLUMNS = {"horarios", "observaciones", "notas", "movimiento", "puesto_texto"}
# Columna -> decimales, segun el numeric() de la tabla.
FLOAT_COLUMNS = {
    "jornada": 4, "jornada_maxima": 4,
    "salario_jornada_completa": 2, "importe_horas_complementarias": 2, "complemento": 2,
    "cotizacion_comunes_pct": 6, "cotizacion_mei_pct": 6,
    "cotizacion_formacion_pct": 6, "cotizacion_desempleo_pct": 6,
}
COTIZACION_COLUMNS = [
    "cotizacion_comunes_pct", "cotizacion_mei_pct",
    "cotizacion_formacion_pct", "cotizacion_desempleo_pct",
]

# tipo_contrato del Excel que no existe en historiales_laborales_contratos (ids 94..135).
CONTRATO_LABORAL_HUERFANOS = {1, 3, 4, 64}
# puesto_id del Excel que no existe en public.puestos.
PUESTO_REMAP = {21: 2, 22: 2}
# Filas cuyo regimen de cotizacion difiere del estandar y se conserva el de Supabase.
PRESERVAR_COTIZACION = {4123, 4131, 4234, 4447, 4452, 4685, 5304, 5892, 5896}

# El 4,70 % de contingencias comunes es el tope plausible; por encima huele a cero perdido.
COTIZACION_COMUNES_MAX = 0.1


def col_index(ref: str) -> int:
    letters = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_sheet(path: Path) -> list[dict[int, str]]:
    """Devuelve una lista de filas; cada fila es {indice_columna: valor_crudo}."""
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            shared = ["".join(t.text or "" for t in si.iter(f"{NS}t"))
                      for si in root.findall(f"{NS}si")]
        root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))

    rows = []
    for row in root.find(f"{NS}sheetData").findall(f"{NS}row"):
        cells: dict[int, str] = {}
        for c in row.findall(f"{NS}c"):
            t = c.get("t")
            if t == "inlineStr":
                node = c.find(f"{NS}is")
                tnode = node.find(f"{NS}t") if node is not None else None
                value = tnode.text if tnode is not None else None
            else:
                v = c.find(f"{NS}v")
                value = v.text if v is not None else None
                if t == "s" and value is not None:
                    value = shared[int(value)]
            if value not in (None, ""):
                cells[col_index(c.get("r"))] = value
        rows.append(cells)
    return rows


def to_bool(raw: str | None) -> bool | None:
    if raw is None:
        return None
    return raw.strip() not in ("0", "FALSE", "FALSO")


def to_int(raw: str | None) -> int | None:
    if raw is None:
        return None
    return int(float(raw))


def to_float(raw: str | None, decimals: int) -> float | None:
    if raw is None:
        return None
    return round(float(raw), decimals)


def to_date(raw: str | None) -> str | None:
    if raw is None:
        return None
    return (EXCEL_EPOCH + datetime.timedelta(days=int(float(raw)))).isoformat()


def to_miles(raw: str | None) -> int | None:
    """coeficiente_temporalidad -> milesimos, quitando antes el ruido de float32."""
    if raw is None:
        return None
    value = float(raw)
    if abs(value) <= 10:
        return round(round(value, 6) * 1000)
    return int(value)


def build_records(path: Path, limit: int | None = None) -> tuple[list[dict], dict[str, int]]:
    rows = read_sheet(path)
    header = {}
    for idx, value in rows[0].items():
        header[value] = idx

    missing = [h for h in COLUMN_MAP if h not in header]
    if missing:
        raise ValueError(f"Faltan columnas esperadas en el Excel: {missing}")

    stats = {"contrato_nulificado": 0, "puesto_remapeado": 0, "cotizacion_preservada": 0}
    records = []
    for row in rows[1:limit + 1 if limit else None]:
        if header["Id"] not in row:
            continue
        record: dict[str, object] = {}
        for source, column in COLUMN_MAP.items():
            raw = row.get(header[source])
            if column in BOOL_COLUMNS:
                record[column] = to_bool(raw)
            elif column in DATE_COLUMNS:
                record[column] = to_date(raw)
            elif column == "coeficiente_temporalidad_miles":
                record[column] = to_miles(raw)
            elif column in INT_COLUMNS:
                record[column] = to_int(raw)
            elif column in FLOAT_COLUMNS:
                record[column] = to_float(raw, FLOAT_COLUMNS[column])
            elif column in TEXT_COLUMNS:
                record[column] = raw.strip() if raw else None
            else:
                record[column] = raw

        if record["contrato_laboral_id"] in CONTRATO_LABORAL_HUERFANOS:
            record["contrato_laboral_id"] = None
            stats["contrato_nulificado"] += 1
        if record["puesto_id"] in PUESTO_REMAP:
            record["puesto_id"] = PUESTO_REMAP[record["puesto_id"]]
            stats["puesto_remapeado"] += 1
        if record["id"] in PRESERVAR_COTIZACION:
            for column in COTIZACION_COLUMNS:
                record.pop(column)
            stats["cotizacion_preservada"] += 1

        records.append(record)
    return records, stats


def check_cotizacion_comunes(records: list[dict]) -> None:
    valores = {r["cotizacion_comunes_pct"] for r in records
               if r.get("cotizacion_comunes_pct") is not None}
    altos = sorted(v for v in valores if v >= COTIZACION_COMUNES_MAX)
    if altos:
        raise SystemExit(
            f"ABORTADO: Dto_Cot_comunes trae valores implausibles {altos}.\n"
            f"El tipo real por contingencias comunes es 0.047 (4,70 %); un 0.47 es un cero\n"
            f"perdido y escribiria un error de x10 en toda la tabla. Corrige la columna en\n"
            f"{DEFAULT_SOURCE_PATH.name} y vuelve a ejecutar."
        )


def post_batch(supabase_url: str, service_role_key: str, batch: list[dict]) -> None:
    payload = json.dumps(batch, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{supabase_url.rstrip('/')}/rest/v1/historiales_laborales?on_conflict=id",
        data=payload,
        method="POST",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise RuntimeError(f"Supabase devolvio {exc.code}: {detail}") from exc


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(
        description="Importa tbl_vida_laboral.xlsx a public.historiales_laborales (upsert por id).")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE_PATH)
    parser.add_argument("--url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--limit", type=int, default=None, help="Procesa solo las primeras N filas.")
    parser.add_argument("--dry-run", action="store_true", help="Solo analiza, no escribe en Supabase.")
    args = parser.parse_args()

    print(f"Leyendo {args.source} ...")
    records, stats = build_records(args.source, args.limit)
    print(f"  filas leidas: {len(records)}")
    print(f"  contrato_laboral_id huerfano -> NULL : {stats['contrato_nulificado']}")
    print(f"  puesto_id 21/22 -> 2                 : {stats['puesto_remapeado']}")
    print(f"  filas con cotizacion preservada      : {stats['cotizacion_preservada']}")

    check_cotizacion_comunes(records)

    # PostgREST exige que todos los objetos de un lote tengan las mismas claves, y las
    # filas preservadas omiten las 4 columnas Dto_*; van en su propio grupo.
    completas = [r for r in records if "cotizacion_comunes_pct" in r]
    preservadas = [r for r in records if "cotizacion_comunes_pct" not in r]

    if args.dry_run:
        print("\n--dry-run: no se escribe nada. Muestra de la primera fila:")
        print(json.dumps(records[0], ensure_ascii=False, indent=2))
        return

    if not args.service_role_key:
        raise SystemExit("Falta --service-role-key (o SUPABASE_SERVICE_ROLE_KEY en el entorno).")

    for nombre, grupo in (("completas", completas), ("cotizacion preservada", preservadas)):
        for i in range(0, len(grupo), args.batch_size):
            batch = grupo[i:i + args.batch_size]
            post_batch(args.url, args.service_role_key, batch)
            print(f"  {nombre}: {i + len(batch)}/{len(grupo)}")

    print(f"\nListo: {len(records)} filas upserted.")
    print(
        "\nPENDIENTE: reposiciona la secuencia del id, que los inserts con id explicito no\n"
        "avanzan. Sin esto la siguiente alta desde la app falla con clave duplicada:\n"
        "  select setval(\n"
        "    pg_get_serial_sequence('public.historiales_laborales', 'id'),\n"
        "    (select max(id) from public.historiales_laborales),\n"
        "    true\n"
        "  );"
    )


if __name__ == "__main__":
    main()
