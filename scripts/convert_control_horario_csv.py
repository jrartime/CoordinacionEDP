from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path


SOURCE_PATH = Path(r"Y:\Bases\control-horario-1776928804.csv")
BASE_EXPORT_PATH = Path(r"D:\Programación\CurriculosEDP\exports\registros.csv")
OUTPUT_PATH = Path(r"D:\Programación\CurriculosEDP\exports\control-horario-1776928804_registros.csv")

TARGET_HEADERS = [
    "id",
    "personal",
    "dni",
    "centro",
    "puesto",
    "fecha",
    "hora_inicio",
    "hora_fin",
    "tipo_jornada",
    "observacion",
    "eliminado",
    "control",
]


def get_last_id(path: Path) -> int:
    if not path.exists():
        return 0

    last_id = 0
    with path.open("r", encoding="utf-8-sig", newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                last_id = max(last_id, int(str(row.get("id", "")).strip()))
            except ValueError:
                continue
    return last_id


def normalize_date(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    return datetime.strptime(raw, "%d/%m/%Y").strftime("%Y-%m-%d")


def normalize_time(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""

    if len(raw) == 5:
        raw = f"{raw}:00"
    return raw


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    next_id = get_last_id(BASE_EXPORT_PATH) + 1
    import_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with SOURCE_PATH.open("r", encoding="utf-8-sig", newline="") as source_file, OUTPUT_PATH.open(
        "w", encoding="utf-8-sig", newline=""
    ) as output_file:
        reader = csv.reader(source_file, delimiter=";")
        writer = csv.writer(output_file)
        writer.writerow(TARGET_HEADERS)

        for row in reader:
            if not row or not any(str(cell).strip() for cell in row):
                continue

            padded = list(row[:9]) + [""] * max(0, 9 - len(row))
            personal, dni, centro, puesto, fecha, hora_inicio, hora_fin, tipo_jornada, observacion = (
                str(cell).strip() for cell in padded[:9]
            )

            writer.writerow(
                [
                    next_id,
                    personal,
                    dni,
                    centro,
                    puesto,
                    normalize_date(fecha),
                    normalize_time(hora_inicio),
                    normalize_time(hora_fin),
                    tipo_jornada or "",
                    observacion or "",
                    "false",
                    import_timestamp,
                ]
            )
            next_id += 1

    print(f"CSV convertido en {OUTPUT_PATH}")
    print(f"Primer id nuevo: {get_last_id(BASE_EXPORT_PATH) + 1}")
    print(f"Timestamp de control: {import_timestamp}")


if __name__ == "__main__":
    main()
