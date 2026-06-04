import csv
import sys
from datetime import datetime
from pathlib import Path


COLUMNS = [
    "codigo_clase",
    "clase",
    "fecha_inicial",
    "estado",
    "codigo_persona",
    "apellidos",
    "nombre",
    "nee",
    "documento",
    "fecha_nacimiento",
    "edad",
    "movil",
    "mail",
    "centro",
    "semana",
    "alumnado",
]

SOURCE_TO_TARGET = {
    "CodigoClase": "codigo_clase",
    "Clase": "clase",
    "Fecha inicial": "fecha_inicial",
    "Estado": "estado",
    "CodigoPersona": "codigo_persona",
    "Apellidos": "apellidos",
    "Nombre": "nombre",
    "NEE": "nee",
    "Documento": "documento",
    "FechaNacimiento": "fecha_nacimiento",
    "Edad": "edad",
    "movil": "movil",
    "Mail": "mail",
    "Centro": "centro",
    "Semana": "semana",
    "Alumnado": "alumnado",
}


def normalize_date(value):
    value = (value or "").strip()
    if not value:
        return ""
    return datetime.strptime(value, "%d/%m/%Y").date().isoformat()


def normalize_int(value):
    value = (value or "").strip()
    return value if value else ""


def normalize_text(value):
    return (value or "").strip()


def normalize_phone(value):
    return normalize_text(value).replace("*", "").replace(" ", "")


def normalize_week(value):
    value = normalize_text(value)
    if not value:
        return ""
    return value.split()[0]


def is_source_date(value):
    try:
        normalize_date(value)
    except ValueError:
        return False
    return True


def normalize_row(row):
    normalized = {target: normalize_text(row.get(source, "")) for source, target in SOURCE_TO_TARGET.items()}
    normalized["fecha_inicial"] = normalize_date(normalized["fecha_inicial"])
    normalized["fecha_nacimiento"] = normalize_date(normalized["fecha_nacimiento"])
    normalized["codigo_persona"] = normalize_int(normalized["codigo_persona"])
    normalized["movil"] = normalize_phone(normalized["movil"])
    normalized["semana"] = normalize_week(normalized["semana"])
    return normalized


def read_source_rows(input_path):
    with input_path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.reader(source, delimiter=";")
        try:
            headers = next(reader)
        except StopIteration:
            return

        for values in reader:
            effective_headers = headers
            if (
                len(values) == len(headers) + 1
                and "Fecha final" not in headers
                and "Fecha inicial" in headers
                and "Estado" in headers
            ):
                insert_at = headers.index("Fecha inicial") + 1
                effective_headers = headers[:insert_at] + ["Fecha final"] + headers[insert_at:]
            elif (
                len(values) == len(headers)
                and "Fecha final" not in headers
                and "Fecha inicial" in headers
                and "Estado" in headers
                and "CodigoPersona" in headers
                and is_source_date(values[headers.index("Fecha inicial") + 1])
            ):
                insert_at = headers.index("Fecha inicial") + 1
                effective_headers = headers[:insert_at] + ["Fecha final"] + headers[insert_at:]
                effective_headers.remove("CodigoPersona")

            yield {
                header: values[index] if index < len(values) else ""
                for index, header in enumerate(effective_headers)
            }


def get_missing_person_key(row):
    document = normalize_text(row.get("documento", "")).lower()
    if document:
        return ("documento", document)

    return (
        "persona",
        normalize_text(row.get("fecha_nacimiento", "")).lower(),
        normalize_text(row.get("alumnado", "")).lower(),
        normalize_text(row.get("mail", "")).lower(),
    )


def fill_missing_person_codes(rows):
    next_code = 900000
    generated_codes = {}

    for row in rows:
        if row.get("codigo_persona"):
            continue

        key = get_missing_person_key(row)
        if key not in generated_codes:
            generated_codes[key] = str(next_code)
            next_code += 1
        row["codigo_persona"] = generated_codes[key]

    return rows


def sql_literal(value, numeric=False):
    if value == "":
        return "null"
    if numeric:
        return value
    return "'" + value.replace("'", "''") + "'"


def build_insert(rows):
    lines = [
        "insert into public.concilia_usuarios (",
        "  " + ", ".join(COLUMNS),
        ") values",
    ]

    values = []
    for row in rows:
        parts = [
            sql_literal(row[column], numeric=(column == "codigo_persona"))
            for column in COLUMNS
        ]
        values.append("  (" + ", ".join(parts) + ")")

    lines.append(",\n".join(values))
    lines.append("on conflict (codigo_clase, codigo_persona, semana) do update set")
    lines.extend(
        [
            "  clase = excluded.clase,",
            "  fecha_inicial = excluded.fecha_inicial,",
            "  estado = excluded.estado,",
            "  apellidos = excluded.apellidos,",
            "  nombre = excluded.nombre,",
            "  nee = excluded.nee,",
            "  documento = excluded.documento,",
            "  fecha_nacimiento = excluded.fecha_nacimiento,",
            "  edad = excluded.edad,",
            "  movil = excluded.movil,",
            "  mail = excluded.mail,",
            "  centro = excluded.centro,",
            "  alumnado = excluded.alumnado,",
            "  updated_at = now();",
            "",
        ]
    )
    return "\n".join(lines)


def write_chunked_inserts(rows, output_dir, chunk_size):
    output_dir.mkdir(parents=True, exist_ok=True)
    chunk_paths = []

    for index, start in enumerate(range(0, len(rows), chunk_size), start=1):
        chunk = rows[start:start + chunk_size]
        chunk_path = output_dir / f"seed_concilia_usuarios_{index:03}.sql"
        chunk_path.write_text(build_insert(chunk), encoding="utf-8", newline="\n")
        chunk_paths.append(chunk_path)

    manifest = output_dir / "README.md"
    manifest.write_text(
        "\n".join(
            [
                "# Seed Conciliausuarios por lotes",
                "",
                "Ejecuta estos archivos en el SQL Editor de Supabase despues de `supabase/tables/concilia_usuarios.sql`.",
                "",
                *[f"{index}. `{path.name}`" for index, path in enumerate(chunk_paths, start=1)],
                "",
            ]
        ),
        encoding="utf-8",
        newline="\n",
    )
    return chunk_paths


def write_import_csv(rows, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main():
    if len(sys.argv) not in (3, 4, 5):
        print(
            "Usage: convert_concilia_usuarios_csv.py input.csv output [--csv | --chunk-size rows]",
            file=sys.stderr,
        )
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    output_csv = False
    chunk_size = None

    if len(sys.argv) == 4:
        if sys.argv[3] != "--csv":
            print("Expected --csv", file=sys.stderr)
            return 2
        output_csv = True

    if len(sys.argv) == 5:
        if sys.argv[3] != "--chunk-size":
            print("Expected --chunk-size", file=sys.stderr)
            return 2
        chunk_size = int(sys.argv[4])

    rows = fill_missing_person_codes([normalize_row(row) for row in read_source_rows(input_path)])

    if output_csv:
        write_import_csv(rows, output_path)
        print(f"Wrote {len(rows)} rows to CSV {output_path}")
    elif chunk_size:
        chunk_paths = write_chunked_inserts(rows, output_path, chunk_size)
        print(f"Wrote {len(rows)} rows in {len(chunk_paths)} chunks to {output_path}")
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(build_insert(rows), encoding="utf-8", newline="\n")
        print(f"Wrote {len(rows)} rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
