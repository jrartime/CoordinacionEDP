#!/usr/bin/env python3
"""Sube a Coordinación las facturas en PDF y sus justificantes de pago.

Recorre carpetas de facturas (p. ej. Y:\\FACTURAS\\2025), empareja cada PDF con su
factura de la tabla contratos_facturacion y lo sube al bucket privado "facturas"
(ver supabase/tables/contratos_facturacion_archivos.sql).

Cómo se emparejan los archivos
  * La factura se identifica por el nombre: F25_105 ..., F-R25_1 ..., F.R26_1 ...
    -> serie 25 / nº 105, serie R25 / nº 1, serie R26 / nº 1.
    Si hay varios PDF de factura con el mismo número, se ignoran los que llevan
    ANULADA en el nombre; si queda uno solo, es el que se sube.
  * Si el PDF contiene el texto «Total factura» es la FACTURA; si no, y trae datos
    de transferencia (banco o Tesorería), es el JUSTIFICANTE. Si el PDF es una imagen
    escaneada (sin texto) se decide por el nombre (JUSTIFICANTE, TESORERIA, PAGO...).
  * Si una factura tiene varios justificantes se prefiere el del banco; si hay
    dos del banco (pagos partidos) no se sube ninguno y se avisa.
  * Nunca se sobrescribe un archivo ya subido salvo con --sobrescribir.

Seguridad
  * Se identifica con TU sesión (correo y contraseña por teclado, no se guardan);
    por tanto rigen tus permisos: solo puedes subir a contratos que gestionas.
  * Por defecto solo muestra lo que haría (simulación). Subir: --aplicar.

Uso
  python scripts/subir_facturas.py --carpeta "Y:\\FACTURAS" --anios 2025 2026
  python scripts/subir_facturas.py --carpeta "Y:\\FACTURAS" --anios 2025 2026 --aplicar
  python scripts/subir_facturas.py --carpeta "Y:\\FACTURAS" --anios 2025 --sin-bd   # solo clasifica

Requisitos: Python 3 y pdftotext (poppler) en el PATH para leer el texto de los PDF.
La URL y la clave pública salen de coordinacion/config.js.
"""
import argparse
import csv
import getpass
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKET = "facturas"
MAX_BYTES = 20 * 1024 * 1024
NAME_JUSTIF = re.compile(r"justific|justifac|justifcant|tesorer|devoluci|ayto|diferencia fianza|\bpago\b", re.I)
NAME_KEY = [
    re.compile(r"^F(-?R)?(\d{2})_(\d+)", re.I),
    re.compile(r"^F\.R(\d{2})_(\d+)", re.I),
    re.compile(r"^R(\d{2})_(\d+)", re.I),
]


# --------------------------------------------------------------------------- config / http
def leer_config():
    texto = open(os.path.join(ROOT, "coordinacion", "config.js"), encoding="utf-8").read()
    url = re.search(r'url:\s*"([^"]+)"', texto).group(1)
    clave = re.search(r'anonKey:\s*"([^"]+)"', texto).group(1)
    esquema = re.search(r'schema:\s*"([^"]+)"', texto)
    return url.rstrip("/"), clave, (esquema.group(1) if esquema else "public")


def peticion(metodo, url, cabeceras, cuerpo=None):
    req = urllib.request.Request(url, data=cuerpo, method=metodo, headers=cabeceras)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            datos = resp.read()
            return resp.status, (json.loads(datos) if datos else None)
    except urllib.error.HTTPError as error:
        detalle = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"HTTP {error.code} en {metodo} {url.split('?')[0]}: {detalle[:300]}")


class Sesion:
    def __init__(self, url, clave, esquema):
        self.url, self.clave, self.esquema, self.token = url, clave, esquema, None

    def entrar(self, correo, contrasena):
        cuerpo = json.dumps({"email": correo, "password": contrasena}).encode()
        _, datos = peticion(
            "POST", f"{self.url}/auth/v1/token?grant_type=password",
            {"apikey": self.clave, "Content-Type": "application/json"}, cuerpo)
        self.token = datos["access_token"]

    def cab(self, extra=None):
        base = {"apikey": self.clave, "Authorization": f"Bearer {self.token}",
                "Accept-Profile": self.esquema, "Content-Profile": self.esquema}
        base.update(extra or {})
        return base

    def facturas(self):
        filas, desde = [], 0
        while True:
            _, lote = peticion(
                "GET",
                f"{self.url}/rest/v1/contratos_facturacion?select=id,contrato_id,serie,n_documento,total,fecha,"
                f"factura_archivo,justificante_archivo&order=id&offset={desde}&limit=1000",
                self.cab())
            filas += lote
            if len(lote) < 1000:
                return filas
            desde += 1000

    def subir(self, ruta, contenido, tipo):
        peticion("POST", f"{self.url}/storage/v1/object/{BUCKET}/{ruta}",
                 self.cab({"Content-Type": tipo, "x-upsert": "false"}), contenido)

    def anotar(self, id_factura, campo, ruta):
        peticion("PATCH", f"{self.url}/rest/v1/contratos_facturacion?id=eq.{id_factura}",
                 self.cab({"Content-Type": "application/json", "Prefer": "return=minimal"}),
                 json.dumps({campo: ruta}).encode())

    def borrar(self, ruta):
        peticion("DELETE", f"{self.url}/storage/v1/object/{BUCKET}/{ruta}", self.cab())


# --------------------------------------------------------------------------- lectura de PDFs
def texto_pdf(ruta):
    if not shutil.which("pdftotext"):
        return None
    try:
        salida = subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", ruta, "-"],
                                capture_output=True, timeout=60)
        return salida.stdout.decode("utf-8", "replace")
    except Exception:
        return None


def clave_de_nombre(nombre):
    for patron in NAME_KEY:
        m = patron.match(nombre)
        if not m:
            continue
        g = m.groups()
        if len(g) == 3:
            return (("R" if g[0] else "") + g[1], int(g[2]))
        return ("R" + g[0], int(g[1]))
    return None


def clasificar(ruta, nombre):
    """Devuelve (tipo, subtipo): tipo = factura | justificante | desconocido."""
    texto = texto_pdf(ruta)
    if texto and "Total factura" in texto:
        return "factura", ""
    if texto and re.search(r"FECHA VALOR|IMPORTE ANOTADO EN CUENTA|ORDEN DE TRANSFERENCIA|Importe L.quido", texto):
        sub = "tesoreria" if re.search(r"ORDEN DE TRANSFERENCIA|LA TESORERA", texto) else "banco"
        return "justificante", sub
    if not texto or len(texto.strip()) < 20:  # escaneado: solo queda el nombre
        if NAME_JUSTIF.search(nombre):
            return "justificante", "tesoreria" if re.search(r"tesorer|ayto", nombre, re.I) else "banco"
        return "factura", "sin-texto"
    if NAME_JUSTIF.search(nombre):  # texto ilegible (fuente rota): decide el nombre
        return "justificante", "banco" if re.search(r"banco", nombre, re.I) else "tesoreria"
    return "desconocido", ""


def escanear(carpeta_raiz, anios):
    encontrados = {}  # clave -> {"factura": [...], "justificante": [...]}
    otros = []
    for anio in anios:
        base = os.path.join(carpeta_raiz, str(anio)) if anios else carpeta_raiz
        for dirpath, _, ficheros in os.walk(base):
            for nombre in sorted(ficheros):
                if not nombre.lower().endswith(".pdf"):
                    continue
                clave = clave_de_nombre(nombre)
                ruta = os.path.join(dirpath, nombre)
                if not clave:
                    otros.append((ruta, "nombre sin formato F<aa>_<n>"))
                    continue
                tipo, sub = clasificar(ruta, nombre)
                if tipo == "desconocido":
                    otros.append((ruta, "no se reconoce como factura ni justificante"))
                    continue
                encontrados.setdefault(clave, {"factura": [], "justificante": []})[tipo].append((ruta, sub))
    return encontrados, otros


# --------------------------------------------------------------------------- selección
def elegir_factura(candidatos):
    if len(candidatos) == 1:
        return candidatos[0][0], ""
    # Con varios PDF del mismo número, se descartan los marcados como ANULADA
    # (copias que se guardan junto al bueno sin borrarlas).
    vigentes = [c for c in candidatos if not re.search(r"anulada", os.path.basename(c[0]), re.I)]
    if len(vigentes) == 1:
        return vigentes[0][0], ""
    return None, f"{len(candidatos)} PDF de factura con el mismo número: " + " | ".join(os.path.basename(c[0]) for c in candidatos)


def elegir_justificante(candidatos):
    if len(candidatos) == 1:
        return candidatos[0][0], ""
    bancos = [c for c in candidatos if c[1] == "banco"]
    if len(bancos) == 1:
        return bancos[0][0], ""
    return None, f"{len(candidatos)} justificantes ({len(bancos)} del banco), súbelo a mano: " + " | ".join(
        os.path.basename(c[0]) for c in candidatos)


# --------------------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser(description="Sube facturas y justificantes a Coordinación.")
    ap.add_argument("--carpeta", required=True, help=r"carpeta raíz, p. ej. Y:\FACTURAS")
    ap.add_argument("--anios", nargs="+", type=int, required=True, help="años (subcarpetas) a procesar")
    ap.add_argument("--aplicar", action="store_true", help="sube de verdad (sin esto solo simula)")
    ap.add_argument("--sobrescribir", action="store_true", help="reemplaza archivos ya subidos")
    ap.add_argument("--sin-bd", action="store_true", help="solo clasifica los PDF, sin conectar")
    ap.add_argument("--informe", default=os.path.join(ROOT, "scripts", "subir_facturas_informe.csv"))
    args = ap.parse_args()

    if not shutil.which("pdftotext"):
        print("AVISO: no encuentro pdftotext; los PDF se clasificarán solo por el nombre.", file=sys.stderr)

    print(f"Leyendo PDFs de {args.carpeta} ({', '.join(map(str, args.anios))})...")
    encontrados, otros = escanear(args.carpeta, args.anios)
    n_fact = sum(1 for v in encontrados.values() if v["factura"])
    n_just = sum(1 for v in encontrados.values() if v["justificante"])
    print(f"  {len(encontrados)} facturas distintas · {n_fact} con PDF de factura · {n_just} con justificante · {len(otros)} PDF sin clasificar")

    informe = []

    def anotar(clave, tipo, estado, detalle=""):
        informe.append({"factura": f"{clave[0]}/{clave[1]}", "tipo": tipo, "estado": estado, "detalle": detalle})

    if args.sin_bd:
        for clave, v in sorted(encontrados.items()):
            for tipo in ("factura", "justificante"):
                if not v[tipo]:
                    continue
                ruta, aviso = (elegir_factura if tipo == "factura" else elegir_justificante)(v[tipo])
                anotar(clave, tipo, "ok" if ruta else "conflicto", ruta and os.path.basename(ruta) or aviso)
        guardar(args.informe, informe, otros)
        return

    url, clave_pub, esquema = leer_config()
    correo = input("Correo de tu cuenta de Coordinación: ").strip()
    contrasena = getpass.getpass("Contraseña (no se muestra ni se guarda): ")
    sesion = Sesion(url, clave_pub, esquema)
    sesion.entrar(correo, contrasena)
    contrasena = None
    print("Sesión iniciada.")

    por_clave = {}
    for fila in sesion.facturas():
        serie = (fila["serie"] or "").strip()
        digitos = re.sub(r"\D", "", fila["n_documento"] or "")
        if serie and digitos:
            por_clave.setdefault((serie, int(digitos)), []).append(fila)

    pendientes = []
    for clave, v in sorted(encontrados.items()):
        filas = por_clave.get(clave, [])
        if not filas:
            anotar(clave, "-", "sin factura en la tabla", "añádela antes y vuelve a ejecutar")
            continue
        if len(filas) > 1:
            anotar(clave, "-", "número repetido en la tabla", f"ids {[f['id'] for f in filas]}")
            continue
        fila = filas[0]
        for tipo, campo, elegir in (("factura", "factura_archivo", elegir_factura),
                                    ("justificante", "justificante_archivo", elegir_justificante)):
            if not v[tipo]:
                continue
            ruta, aviso = elegir(v[tipo])
            if not ruta:
                anotar(clave, tipo, "conflicto", aviso)
                continue
            if fila[campo] and not args.sobrescribir:
                anotar(clave, tipo, "ya tiene archivo", fila[campo])
                continue
            if os.path.getsize(ruta) > MAX_BYTES:
                anotar(clave, tipo, "demasiado grande", os.path.basename(ruta))
                continue
            pendientes.append((clave, tipo, campo, fila, ruta))

    print(f"\nPor subir: {len(pendientes)} archivos.")
    hechos = 0
    for clave, tipo, campo, fila, ruta in pendientes:
        destino = f"{fila['contrato_id']}/{fila['id']}/{tipo}-{int(time.time() * 1000)}.pdf"
        if not args.aplicar:
            anotar(clave, tipo, "simulado", f"{os.path.basename(ruta)} -> {destino}")
            continue
        try:
            with open(ruta, "rb") as archivo:
                sesion.subir(destino, archivo.read(), "application/pdf")
            sesion.anotar(fila["id"], campo, destino)
            if fila[campo]:
                sesion.borrar(fila[campo])
            hechos += 1
            anotar(clave, tipo, "subido", os.path.basename(ruta))
            print(f"  ✓ {clave[0]}/{clave[1]} {tipo}")
        except Exception as error:  # noqa: BLE001 - se informa y se sigue con el resto
            anotar(clave, tipo, "error", str(error)[:200])
            print(f"  ✗ {clave[0]}/{clave[1]} {tipo}: {error}")
        time.sleep(0.05)

    guardar(args.informe, informe, otros)
    if args.aplicar:
        print(f"\nSubidos {hechos} de {len(pendientes)}.")
    else:
        print("\nSimulación terminada: no se ha subido nada. Revisa el informe y repite con --aplicar.")


def guardar(ruta, informe, otros):
    resumen = {}
    for fila in informe:
        resumen[fila["estado"]] = resumen.get(fila["estado"], 0) + 1
    with open(ruta, "w", newline="", encoding="utf-8-sig") as salida:
        escritor = csv.DictWriter(salida, fieldnames=["factura", "tipo", "estado", "detalle"], delimiter=";")
        escritor.writeheader()
        escritor.writerows(informe)
        for archivo, motivo in otros:
            escritor.writerow({"factura": "", "tipo": "sin clasificar", "estado": motivo, "detalle": archivo})
    print("\nResumen:", ", ".join(f"{k}: {v}" for k, v in sorted(resumen.items())) or "(vacío)")
    print(f"Informe: {ruta}")


if __name__ == "__main__":
    main()
