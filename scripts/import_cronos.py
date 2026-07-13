"""Importa el CSV de Cronos (apuntes de inscripciones/actividades) a public.cronos.

Formato de origen (export de Cronos):
  - Delimitador ';', codificacion UTF-8 con BOM.
  - Decimales con coma ("6,50"); se convierten a punto.
  - Valores ausentes como '----' o vacio -> NULL.
  - Fechas dd/mm/aaaa -> ISO; horas H:MM:SS -> HH:MM:SS.
  - "Anulado": No/Si -> boolean.
  - "Id" es unico -> se usa como id_origen (upsert idempotente).

Uso:
  python scripts/import_cronos.py --dry-run
  python scripts/import_cronos.py --limit 100 --dry-run
  python scripts/import_cronos.py --service-role-key ...
  (o con SUPABASE_SERVICE_ROLE_KEY en el entorno)
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_SOURCE_PATH = Path(r"C:\Users\Jr\OneDrive\JR\Tablas maestras\Cronos.csv")
DEFAULT_SUPABASE_URL = "https://epbtoarkinvgcaewbtvs.supabase.co"
DEFAULT_BATCH_SIZE = 5000

# Cabecera del CSV -> columna en public.cronos.
COLUMN_MAP = {
    "Id": "id_origen",
    "Apunte": "apunte",
    "Fecha": "fecha",
    "Hora": "hora",
    "Código de tarifa": "codigo_tarifa",
    "Tarifa": "tarifa",
    "Temporada": "temporada",
    "Cantidad": "cantidad",
    "Importe": "importe",
    "Periodo de pago": "periodo_pago",
    "Forma de pago": "forma_pago",
    "Tipo de apunte": "tipo_apunte",
    "Anulado": "anulado",
    "Prefijo de la factura": "prefijo_factura",
    "Número de factura": "numero_factura",
    "Operador": "operador",
    "Máquina": "maquina",
    "Centro": "centro",
    "Caja": "caja",
    "CodigoPersona": "codigo_persona",
    "Apellidos": "apellidos",
    "Nombre": "nombre",
    "Documento": "documento",
    "Sexo": "sexo",
    "fecha_nac": "fecha_nac",
    "edad": "edad",
    "telefono": "telefono",
    "movil": "movil",
    "emial": "email",
    "Servicio": "servicio",
    "Tipo de servicio": "tipo_servicio",
    "Periodo de la clase": "periodo_clase",
    "Concepto": "concepto",
    "Identificador": "identificador",
    "Autorización": "autorizacion",
}

DATE_COLUMNS = {"fecha", "fecha_nac"}
NUM_COLUMNS = {"cantidad", "importe"}
INT_COLUMNS = {"id_origen", "apunte", "edad"}
TIME_COLUMNS = {"hora"}
BOOL_COLUMNS = {"anulado"}
EMPTY_TOKENS = {"", "----"}


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return None if value in EMPTY_TOKENS else value


def to_iso_date(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None
    parts = value.split("/")
    if len(parts) == 3:
        day, month, year = parts
        return f"{year.zfill(4)}-{month.zfill(2)}-{day.zfill(2)}"
    return None  # "--" u otros marcadores no-fecha -> NULL


def to_time(value: str | None) -> str | None:
    value = clean(value)
    if value is None:
        return None
    parts = value.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return f"{h.zfill(2)}:{m.zfill(2)}:{s.zfill(2)}"
    return value


def to_num(value: str | None) -> float | None:
    value = clean(value)
    if value is None:
        return None
    return float(value.replace(".", "").replace(",", ".")) if "," in value else float(value)


def to_int(value: str | None) -> int | None:
    value = clean(value)
    if value is None:
        return None
    return int(float(value.replace(",", ".")))


def to_bool_si(value: str | None) -> bool | None:
    value = clean(value)
    if value is None:
        return None
    return value.strip().lower() in {"si", "sí", "s", "true", "1"}


def transform_value(column: str, raw: str | None):
    if column in DATE_COLUMNS:
        return to_iso_date(raw)
    if column in TIME_COLUMNS:
        return to_time(raw)
    if column in NUM_COLUMNS:
        return to_num(raw)
    if column in INT_COLUMNS:
        return to_int(raw)
    if column in BOOL_COLUMNS:
        return to_bool_si(raw)
    return clean(raw)


def load_and_transform(path: Path, limit: int | None = None):
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f, delimiter=";")
        headers = [h.strip() for h in next(reader)]
        missing = [h for h in COLUMN_MAP if h not in headers]
        if missing:
            raise ValueError(f"Faltan columnas esperadas en el CSV: {missing}")
        idx = {h: i for i, h in enumerate(headers)}

        rows: list[dict[str, object]] = []
        for n, row in enumerate(reader):
            if limit is not None and n >= limit:
                break
            if not row or not clean(row[idx["Id"]]):
                continue
            record = {}
            for header, column in COLUMN_MAP.items():
                record[column] = transform_value(column, row[idx[header]])
            rows.append(record)
    return rows


def post_batch(supabase_url: str, service_role_key: str, batch: list[dict[str, object]]) -> None:
    payload = json.dumps(batch, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{supabase_url.rstrip('/')}/rest/v1/cronos?on_conflict=id_origen",
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

    parser = argparse.ArgumentParser(description="Importa el CSV de Cronos a public.cronos.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE_PATH)
    parser.add_argument("--url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--limit", type=int, default=None, help="Procesa solo las primeras N filas (pruebas).")
    parser.add_argument("--dry-run", action="store_true", help="Solo analiza, no escribe en Supabase.")
    args = parser.parse_args()

    print(f"Leyendo {args.source} ...")
    rows = load_and_transform(args.source, limit=args.limit)
    print(f"Filas validas: {len(rows)}")
    if rows:
        muestra = {k: rows[0][k] for k in ("id_origen", "fecha", "hora", "importe", "anulado", "centro", "tipo_servicio")}
        print(f"  Ejemplo (fila 1): {muestra}")

    if args.dry_run:
        print("Dry-run: no se escribio nada en Supabase.")
        return

    if not args.service_role_key:
        raise SystemExit("Falta SUPABASE_SERVICE_ROLE_KEY o --service-role-key para escribir en Supabase.")

    total = len(rows)
    for start in range(0, total, args.batch_size):
        batch = rows[start:start + args.batch_size]
        post_batch(args.url, args.service_role_key, batch)
        print(f"  Cargadas {min(start + len(batch), total)}/{total}")
        time.sleep(0.2)

    print("Carga completada.")


if __name__ == "__main__":
    main()
