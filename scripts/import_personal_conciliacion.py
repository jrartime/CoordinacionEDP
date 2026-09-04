"""Importa Tbl_Personal_Conciliacion.xlsx (Access) a public.personal_conciliacion.

Estrategia: UPSERT por `id`, nunca borrado (mismo motivo que import_vida_laboral.py).

Excluida por violar el CHECK de fechas (fecha_fin >= fecha_inicio):
  - id 69: fecha_fin (2026-06-30) anterior a fecha_inicio (2026-07-01) en el Excel,
    parece un tecleo cruzado. Revisar a mano si se quiere recuperar.

`Tipo` (Excel) -> `tipo_id`: los ids del catalogo Access se preservaron tal cual en
personal_conciliacion_tipo (ver supabase/tables/personal_conciliacion.sql).

7 filas con `Tipo` = "Medida especial de conciliacion" pero observacion literal
"Maternidad"/"Paternidad"/"Riesgo en el Embarazo" NO se importan aqui: se
reclasifican a personal_bajas (que ya tiene un tipo propio con
sin_nomina_empresa=true para esos casos) por import_personal_bajas.py. Ver
RECLASIFICAR_A_BAJAS y ejecutar siempre ese script tambien, o pasan filas sin
importar a ningun sitio.

Uso:
  python scripts/import_personal_conciliacion.py --dry-run
  python scripts/import_personal_conciliacion.py --service-role-key ...
  (o con SUPABASE_SERVICE_ROLE_KEY en el entorno)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import openpyxl

DEFAULT_SOURCE_PATH = Path(r"C:\Users\Jr\OneDrive\JR\Tablas maestras\Tbl_Personal_Conciliacion.xlsx")
DEFAULT_SUPABASE_URL = "https://epbtoarkinvgcaewbtvs.supabase.co"
DEFAULT_BATCH_SIZE = 500

EXCLUIR = {
    69: "fecha_fin anterior a fecha_inicio en el Excel (tecleo cruzado)",
}

# Se reclasifican a personal_bajas por import_personal_bajas.py; no se importan aqui.
RECLASIFICAR_A_BAJAS = {45, 46, 57, 64, 66, 68, 71}


def to_date(v) -> str | None:
    return None if v is None else v.date().isoformat()


def build_records(path: Path) -> tuple[list[dict], list[tuple[int, str]]]:
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))[1:]

    records = []
    excluidas = []
    for row in rows:
        rid, personal_id, fecha_inicio, fecha_fin, tipo, observacion = row
        if rid in EXCLUIR:
            excluidas.append((rid, EXCLUIR[rid]))
            continue
        if rid in RECLASIFICAR_A_BAJAS:
            continue
        records.append({
            "id": rid,
            "personal_id": personal_id,
            "tipo_id": tipo,
            "fecha_inicio": to_date(fecha_inicio),
            "fecha_fin": to_date(fecha_fin),
            "observacion": observacion,
        })
    return records, excluidas


def post_batch(supabase_url: str, service_role_key: str, batch: list[dict]) -> None:
    payload = json.dumps(batch, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{supabase_url.rstrip('/')}/rest/v1/personal_conciliacion?on_conflict=id",
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
        description="Importa Tbl_Personal_Conciliacion.xlsx a public.personal_conciliacion (upsert por id).")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE_PATH)
    parser.add_argument("--url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--dry-run", action="store_true", help="Solo analiza, no escribe en Supabase.")
    args = parser.parse_args()

    print(f"Leyendo {args.source} ...")
    records, excluidas = build_records(args.source)
    print(f"  filas: {len(records)}")
    print(f"  reclasificadas a personal_bajas (no importadas aqui): {len(RECLASIFICAR_A_BAJAS)}")
    for rid, motivo in excluidas:
        print(f"  EXCLUIDA id {rid}: {motivo}")

    if args.dry_run:
        print("\n--dry-run: no se escribe nada. Muestra de la primera fila:")
        print(json.dumps(records[0], ensure_ascii=False, indent=2))
        return

    if not args.service_role_key:
        raise SystemExit("Falta --service-role-key (o SUPABASE_SERVICE_ROLE_KEY en el entorno).")

    for i in range(0, len(records), args.batch_size):
        batch = records[i:i + args.batch_size]
        post_batch(args.url, args.service_role_key, batch)
        print(f"  {i + len(batch)}/{len(records)}")

    print(f"\nListo: {len(records)} filas upserted.")
    print(
        "\nPENDIENTE: reposiciona la secuencia del id, que los inserts con id explicito no\n"
        "avanzan. Sin esto la siguiente alta desde la app falla con clave duplicada:\n"
        "  select setval(\n"
        "    pg_get_serial_sequence('public.personal_conciliacion', 'id'),\n"
        "    (select max(id) from public.personal_conciliacion),\n"
        "    true\n"
        "  );"
    )


if __name__ == "__main__":
    main()
