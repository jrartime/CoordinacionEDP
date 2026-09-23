"""Importa exports "fichajes_detalle_*.csv" (app de control horario) a
public.registros_horarios.

El export trae Empleado/Email/Puesto/Centro/Entrada/Salida/Ausentismo/
Teletrabajo/Desplazamiento/Horas extra/Observaciones por fichaje
(parteHorasId), pero solo un puñado de personas (las que tienen Puesto/Centro
configurados en la app de fichaje) llevan esos dos campos rellenos. El resto
(sobre todo monitores de Concilia) no los trae, y registros_horarios los exige
NOT NULL.

Reglas aplicadas (acordadas con el usuario 2026-09-22):
  - dni se resuelve por email contra personal.email (case-insensitive).
    Emails de prueba conocidos (test-employee@example.com, cecchinimusic@
    gmail.com = "Juan Coordinacion") se descartan sin más.
  - Cuando el fichaje ya trae Puesto/Centro, se usan tal cual (texto libre,
    igual que hacen las cargas anteriores de este mismo formato).
  - Cuando faltan, se busca la actividad (public.actividades_detalle) de esa
    persona activa ese día concreto: fecha entre fecha_inicio/fecha_fin y el
    día de la semana (ISO, lunes=1) en dias_semana. Si hay varias, se elige la
    de mayor solape horario con el fichaje; si hay empate, la de rango de
    fechas más corto (más específica). Sin ninguna actividad que encaje, la
    fila se descarta y se reporta en el CSV de --unresolved-report.
  - tipo_jornada se deja NULL (igual que las filas ya importadas con estos
    mismos flags); ausentismo/teletrabajo/desplazamiento_fichaje/horas_extra
    vienen del propio fichaje.
  - Duplicados: se descarta cualquier fichaje cuyo (dni, fecha, hora_inicio,
    hora_fin) ya exista en registros_horarios (no hay columna para
    parteHorasId en la tabla final).

Uso:
  python scripts/import_fichajes_detalle.py --dry-run fichero1.csv fichero2.csv
  python scripts/import_fichajes_detalle.py fichero1.csv fichero2.csv
  (con SUPABASE_SERVICE_ROLE_KEY en el entorno, o --service-role-key ...)
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, time as dtime
from pathlib import Path

DEFAULT_SUPABASE_URL = "https://epbtoarkinvgcaewbtvs.supabase.co"
DEFAULT_BATCH_SIZE = 1000

TEST_EMAILS = {"cecchinimusic@gmail.com", "test-employee@example.com"}


# --- Lectura y normalizacion del CSV de origen -----------------------------

def parse_bool(v: str) -> bool:
    return str(v).strip().lower() in ("si", "sí", "true", "1", "yes")


def parse_num(v: str) -> float | None:
    v = str(v or "").strip().replace(",", ".")
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def read_fichajes_csv(path: Path) -> list[dict]:
    records = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        for raw_row in reader:
            if not any(c.strip() for c in raw_row):
                continue
            if len(raw_row) == 1 and raw_row[0].count(",") >= len(header) - 1:
                # El export a veces envuelve la linea entera en un campo con
                # comillas dobles cuando Observaciones lleva una coma.
                inner = raw_row[0]
                if inner.startswith('"') and inner.endswith('"'):
                    inner = inner[1:-1]
                inner = inner.replace('""', '"')
                raw_row = next(csv.reader([inner]))
            row = dict(zip(header, raw_row))
            g = lambda k: (row.get(k) or "").strip()

            entrada = g("Entrada")
            salida = g("Salida")
            if not entrada:
                continue
            dt_in = datetime.fromisoformat(entrada)
            dt_out = datetime.fromisoformat(salida) if salida else None

            records.append({
                "parte_id": g("parteHorasId"),
                "empleado": g("Empleado"),
                "email": g("Email").lower(),
                "puesto_raw": g("Puesto"),
                "centro_raw": g("Centro"),
                "fecha": dt_in.date(),
                "hora_inicio": dt_in.time(),
                "hora_fin": dt_out.time() if dt_out else None,
                "horas_extra": parse_num(g("Horas extra")),
                "ausentismo": parse_bool(g("Ausentismo")),
                "teletrabajo": parse_bool(g("Teletrabajo")),
                "desplazamiento": parse_bool(g("Desplazamiento")),
                "observaciones": g("Observaciones") or None,
            })
    return records


def dedupe_by_parte_id(records: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for r in records:
        key = r["parte_id"] or (r["email"], r["fecha"], r["hora_inicio"], r["hora_fin"])
        seen[key] = r  # el ultimo export gana si se repite el parte_id
    return list(seen.values())


# --- Acceso a Supabase (REST, service role) --------------------------------

def rest_get(url: str, service_role_key: str, path: str, params: dict) -> list[dict]:
    results: list[dict] = []
    offset = 0
    page_size = 1000
    while True:
        query = dict(params)
        query["limit"] = page_size
        query["offset"] = offset
        full_url = f"{url.rstrip('/')}/rest/v1/{path}?{urllib.parse.urlencode(query, safe='(),.*')}"
        request = urllib.request.Request(
            full_url,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
            },
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            page = json.loads(response.read().decode("utf-8"))
        results.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    return results


def chunked(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def fetch_personal_by_email(url: str, key: str) -> dict[str, tuple[int, str]]:
    rows = rest_get(url, key, "personal", {"select": "id,dni,email"})
    out: dict[str, tuple[int, str]] = {}
    for row in rows:
        email = (row.get("email") or "").strip().lower()
        if email and row.get("dni"):
            out[email] = (row["id"], row["dni"])
    return out


def fetch_actividades(url: str, key: str, personal_ids: list[int]) -> dict[int, list[dict]]:
    by_personal: dict[int, list[dict]] = {}
    for chunk in chunked(sorted(set(personal_ids)), 200):
        id_list = ",".join(str(i) for i in chunk)
        rows = rest_get(url, key, "actividades_detalle", {
            "select": "personal_id,instalacion,puesto,fecha_inicio,fecha_fin,hora_inicio,hora_fin,dias_semana",
            "personal_id": f"in.({id_list})",
        })
        for row in rows:
            by_personal.setdefault(row["personal_id"], []).append(row)
    return by_personal


def fetch_existing_registros(url: str, key: str, dnis: list[str], fecha_min: date, fecha_max: date) -> set[tuple]:
    existing: set[tuple] = set()
    for chunk in chunked(sorted(set(dnis)), 100):
        quoted = ",".join(f'"{d}"' for d in chunk)
        rows = rest_get(url, key, "registros_horarios", {
            "select": "dni,fecha,hora_inicio,hora_fin",
            "dni": f"in.({quoted})",
            "and": f"(fecha.gte.{fecha_min.isoformat()},fecha.lte.{fecha_max.isoformat()})",
        })
        for row in rows:
            existing.add((row["dni"], row["fecha"], row["hora_inicio"], row["hora_fin"]))
    return existing


def fetch_max_id(url: str, key: str) -> int:
    rows = rest_get(url, key, "registros_horarios", {"select": "id", "order": "id.desc", "limit": 1})
    return int(rows[0]["id"]) if rows else 0


# --- Resolucion de puesto/centro va actividades ----------------------------

def parse_pg_time(value) -> dtime:
    if isinstance(value, dtime):
        return value
    h, m, s = (value.split(":") + ["0", "0"])[:3]
    return dtime(int(h), int(m), int(float(s)))


def overlap_minutes(a_start: dtime, a_end: dtime, b_start: dtime, b_end: dtime) -> int:
    def to_min(t: dtime) -> int:
        return t.hour * 60 + t.minute

    a1, a2 = to_min(a_start), to_min(a_end)
    b1, b2 = to_min(b_start), to_min(b_end)
    if a2 < a1:
        a2 += 24 * 60
    if b2 < b1:
        b2 += 24 * 60
    return max(0, min(a2, b2) - max(a1, b1))


def find_matching_activity(activities: list[dict], fecha: date, hora_inicio: dtime, hora_fin: dtime) -> dict | None:
    isodow = fecha.isoweekday()
    candidates = []
    for act in activities:
        fi = date.fromisoformat(act["fecha_inicio"])
        ff = date.fromisoformat(act["fecha_fin"]) if act.get("fecha_fin") else date.max
        if not (fi <= fecha <= ff):
            continue
        dias = act.get("dias_semana") or []
        if dias and isodow not in dias:
            continue
        candidates.append((fi, ff, act))

    if not candidates:
        return None

    def score(item):
        fi, ff, act = item
        act_start = parse_pg_time(act["hora_inicio"]) if act.get("hora_inicio") else None
        act_end = parse_pg_time(act["hora_fin"]) if act.get("hora_fin") else None
        overlap = overlap_minutes(act_start, act_end, hora_inicio, hora_fin or hora_inicio) if act_start and act_end else 0
        span_days = (ff - fi).days if ff != date.max else 999999
        return (overlap, -span_days)

    candidates.sort(key=score, reverse=True)
    return candidates[0][2]


# --- Programa principal ------------------------------------------------------

def build_rows(records, personal_by_email, activities_by_personal):
    resolved = []
    unresolved = []
    for r in records:
        if r["email"] in TEST_EMAILS:
            continue
        match = personal_by_email.get(r["email"])
        if not match:
            unresolved.append({**r, "motivo": "email_sin_personal"})
            continue
        personal_id, dni = match

        puesto = r["puesto_raw"]
        centro = r["centro_raw"]
        origen = "fichaje"
        if not puesto or not centro:
            acts = activities_by_personal.get(personal_id, [])
            act = find_matching_activity(acts, r["fecha"], r["hora_inicio"], r["hora_fin"] or r["hora_inicio"])
            if not act:
                unresolved.append({**r, "motivo": "sin_actividad_ese_dia"})
                continue
            puesto = act["puesto"]
            centro = act["instalacion"]
            origen = "actividad"

        resolved.append({
            "personal": r["empleado"],
            "dni": dni,
            "centro": centro,
            "puesto": puesto,
            "fecha": r["fecha"],
            "hora_inicio": r["hora_inicio"],
            "hora_fin": r["hora_fin"],
            "ausentismo": r["ausentismo"],
            "teletrabajo": r["teletrabajo"],
            "desplazamiento_fichaje": r["desplazamiento"],
            "horas_extra": r["horas_extra"],
            "observacion": r["observaciones"],
            "_origen_puesto_centro": origen,
        })
    return resolved, unresolved


def post_batch(url: str, key: str, batch: list[dict]) -> None:
    payload = json.dumps(
        [{k: v for k, v in row.items() if not k.startswith("_")} for row in batch],
        ensure_ascii=False,
        default=str,
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/registros_horarios",
        data=payload,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise RuntimeError(f"Supabase devolvio {exc.code}: {detail}") from exc


def write_report(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["motivo", "empleado", "email", "fecha", "hora_inicio", "hora_fin", "puesto_raw", "centro_raw"]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sources", type=Path, nargs="+", help="CSV(s) fichajes_detalle_*.csv")
    parser.add_argument("--url", default=os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL))
    parser.add_argument("--service-role-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--unresolved-report", type=Path, default=Path("exports/fichajes_detalle_sin_resolver.csv"))
    parser.add_argument("--dry-run", action="store_true", help="Solo analiza y reporta, no escribe en Supabase.")
    args = parser.parse_args()

    if not args.service_role_key:
        raise SystemExit("Falta SUPABASE_SERVICE_ROLE_KEY o --service-role-key.")

    print("Leyendo CSV(s) de origen...")
    all_records: list[dict] = []
    for source in args.sources:
        recs = read_fichajes_csv(source)
        print(f"  {source}: {len(recs)} filas")
        all_records.extend(recs)

    records = dedupe_by_parte_id(all_records)
    print(f"Total tras deduplicar por parteHorasId entre ficheros: {len(records)}")

    print("Consultando personal (email -> dni)...")
    personal_by_email = fetch_personal_by_email(args.url, args.service_role_key)

    needing_activity_emails = {
        r["email"] for r in records
        if r["email"] not in TEST_EMAILS and (not r["puesto_raw"] or not r["centro_raw"])
    }
    personal_ids_needed = [
        personal_by_email[e][0] for e in needing_activity_emails if e in personal_by_email
    ]
    print(f"Personas que necesitan resolver puesto/centro via actividades: {len(personal_ids_needed)}")

    print("Consultando actividades de esas personas...")
    activities_by_personal = fetch_actividades(args.url, args.service_role_key, personal_ids_needed)

    resolved, unresolved = build_rows(records, personal_by_email, activities_by_personal)
    print(f"Resueltas: {len(resolved)}  Sin resolver: {len(unresolved)}")

    origen_counts: dict[str, int] = {}
    for row in resolved:
        origen_counts[row["_origen_puesto_centro"]] = origen_counts.get(row["_origen_puesto_centro"], 0) + 1
    print(f"  Puesto/centro directos del fichaje: {origen_counts.get('fichaje', 0)}")
    print(f"  Puesto/centro resueltos via actividades: {origen_counts.get('actividad', 0)}")

    if not resolved:
        print("Nada que importar.")
        return

    fechas = [row["fecha"] for row in resolved]
    fecha_min, fecha_max = min(fechas), max(fechas)
    dnis = [row["dni"] for row in resolved]

    print(f"Consultando registros_horarios existentes ({fecha_min}..{fecha_max}) para deduplicar...")
    existing = fetch_existing_registros(args.url, args.service_role_key, dnis, fecha_min, fecha_max)

    new_rows = []
    dup_count = 0
    for row in resolved:
        key = (
            row["dni"],
            row["fecha"].isoformat(),
            row["hora_inicio"].isoformat(),
            row["hora_fin"].isoformat() if row["hora_fin"] else None,
        )
        if key in existing:
            dup_count += 1
            continue
        new_rows.append(row)

    print(f"Ya existian (duplicados, no se reinsertan): {dup_count}")
    print(f"Filas nuevas a insertar: {len(new_rows)}")

    if unresolved:
        write_report(args.unresolved_report, unresolved)
        print(f"Informe de fichajes sin resolver: {args.unresolved_report}")

    if args.dry_run:
        print("Dry-run: no se escribio nada en Supabase.")
        return

    if not new_rows:
        print("No hay filas nuevas que insertar.")
        return

    next_id = fetch_max_id(args.url, args.service_role_key) + 1
    now_str = datetime.now().isoformat(sep=" ", timespec="seconds")
    for row in new_rows:
        row["id"] = next_id
        next_id += 1
        row["control"] = now_str
        row.pop("_origen_puesto_centro", None)

    total = len(new_rows)
    for start in range(0, total, args.batch_size):
        batch = new_rows[start:start + args.batch_size]
        post_batch(args.url, args.service_role_key, batch)
        print(f"  Cargadas {min(start + len(batch), total)}/{total}")
        time.sleep(0.2)

    print("Carga completada.")


if __name__ == "__main__":
    main()
