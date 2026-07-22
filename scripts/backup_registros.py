"""Vuelca public.registros completo a un CSV antes de una recarga masiva.

Se usa como red de seguridad del reimport de registros: la tabla se vacia por
rango de fechas y se recarga desde el Excel de origen, asi que conviene tener el
estado previo en disco.

El destino va a exports/ (carpeta no versionada) porque son datos de personal.

Uso:
  python scripts/backup_registros.py
  python scripts/backup_registros.py --output ruta/al.csv
  (requiere SUPABASE_SERVICE_ROLE_KEY en el entorno, o --service-role-key)
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

DEFAULT_SUPABASE_URL = "https://epbtoarkinvgcaewbtvs.supabase.co"
# PostgREST limita a 1000 filas por peticion (db-max-rows), asi que la pagina no
# puede ser mayor o el bucle cortaria en la primera vuelta.
PAGE_SIZE = 1000

COLUMNS = [
    "id", "fecha", "actividad_id", "empresa_id", "contrato_id", "personal_id",
    "instalacion_id", "categoria_id", "puesto_id", "funcion_id", "modalidad_id",
    "nivel_id", "grupo_id", "nota", "dia_id", "hora_inicio", "hora_fin", "horas",
    "hc", "hf", "hm", "hd", "bolsa_horas", "horas_diurnas", "horas_nocturnas",
    "clases", "horas_2", "descanso", "activo", "festivo", "sustitucion",
    "facturar", "abonar", "tipo_hora_id", "situacion_id", "anio", "observacion",
    "control", "factura", "servicio_id", "sustituye_registro_id", "legacy_id_hora",
]


def fetch_page(url: str, key: str, offset: int, limit: int) -> list[dict]:
    endpoint = (
        f"{url}/rest/v1/registros"
        f"?select={','.join(COLUMNS)}&order=id.asc&offset={offset}&limit={limit}"
    )
    req = urllib.request.Request(endpoint, method="GET")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--supabase-url", default=DEFAULT_SUPABASE_URL)
    parser.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if not args.service_role_key:
        print("Falta SUPABASE_SERVICE_ROLE_KEY (entorno o --service-role-key).", file=sys.stderr)
        return 2

    if args.output:
        out = Path(args.output)
    else:
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        out = Path(__file__).resolve().parents[1] / "exports" / f"registros_backup_{stamp}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)

    total = 0
    offset = 0
    with out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        while True:
            try:
                page = fetch_page(args.supabase_url, args.service_role_key, offset, PAGE_SIZE)
            except urllib.error.HTTPError as exc:
                print(f"HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')[:400]}", file=sys.stderr)
                return 1
            if not page:
                break
            for row in page:
                writer.writerow({c: ("" if row.get(c) is None else row.get(c)) for c in COLUMNS})
            total += len(page)
            offset += len(page)
            print(f"  {total} filas...", flush=True)
            if len(page) < PAGE_SIZE:
                break

    print(f"OK. {total} filas -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
