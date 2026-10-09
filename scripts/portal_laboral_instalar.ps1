# Instalacion del Portal laboral en un ordenador nuevo.
#
# Prepara lo local que necesitan la pestana Personal (ayudante de carpetas) y la
# pestana Gestion > Enviar nominas (app Flask de Nominas + Outlook):
#   1. Comprueba que la carpeta esta en C:\portal-laboral.
#   2. Comprueba (o instala con winget) Python 3.13 con tcl/tk.
#   3. Crea el entorno virtual de nominas\ e instala sus dependencias.
#   4. Comprueba que Outlook de escritorio (clasico) esta disponible.
#   5. Crea el acceso directo de Inicio del ayudante y lo arranca ya.
#
# Se puede ejecutar varias veces sin problema. Uso: doble clic en instalar.bat.

$ErrorActionPreference = "Stop"

$root = "C:\portal-laboral"
$nominas = Join-Path $root "nominas"
$ayudante = Join-Path $root "ayudante"
$venvPython = Join-Path $nominas ".venv\Scripts\python.exe"
$avisos = @()

function Paso($texto) { Write-Host ""; Write-Host "== $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "   OK  $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "   !!  $texto" -ForegroundColor Yellow; $script:avisos += $texto }

# --- 1. Ubicacion -----------------------------------------------------------
Paso "Comprobando la ubicacion"
if ((Resolve-Path $PSScriptRoot).Path.TrimEnd('\') -ne $root) {
  throw "Esta carpeta debe estar en $root (ahora esta en $PSScriptRoot): el ayudante tiene esa ruta fija. Muevela y vuelve a ejecutar."
}
foreach ($ruta in @("$nominas\flask_app.py", "$nominas\requirements.txt", "$ayudante\carpeta_helper.ps1")) {
  if (-not (Test-Path -LiteralPath $ruta)) { throw "Falta $ruta. Copia la carpeta portal-laboral completa." }
}
Ok "$root con nominas\ y ayudante\"

# --- 2. Python --------------------------------------------------------------
Paso "Comprobando Python"

function Find-Python {
  # Un Python real, no el alias de la Microsoft Store (que abre la tienda).
  foreach ($candidato in @("py", "python")) {
    $cmd = Get-Command $candidato -ErrorAction SilentlyContinue
    if (-not $cmd -or $cmd.Source -like "*WindowsApps*") { continue }
    try {
      $extra = if ($candidato -eq "py") { @("-3") } else { @() }
      $v = & $cmd.Source @extra -c "import sys, tkinter; print('%d.%d' % sys.version_info[:2])" 2>$null
      if ($LASTEXITCODE -eq 0 -and [version]$v -ge [version]"3.10") {
        return @{ Exe = $cmd.Source; Args = $extra; Version = $v }
      }
    } catch { }
  }
  return $null
}

$python = Find-Python
if (-not $python) {
  Write-Host "   No hay un Python 3.10+ con tcl/tk. Intentando instalar Python 3.13 con winget..."
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    winget install --id Python.Python.3.13 -e --scope user --accept-package-agreements --accept-source-agreements
    # El PATH de esta sesion no se entera; se busca en la ruta habitual de instalacion.
    $habitual = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\python.exe"
    if (Test-Path $habitual) { $env:Path = "$(Split-Path $habitual);$env:Path" }
    $python = Find-Python
  }
}
if (-not $python) {
  throw "No se pudo localizar Python. Instalalo desde python.org (marca 'Add python to PATH' y deja tcl/tk) y vuelve a ejecutar este script."
}
Ok "Python $($python.Version) ($($python.Exe))"

# --- 3. Entorno virtual -----------------------------------------------------
Paso "Preparando la app de Nominas"
$venvValido = $false
if (Test-Path $venvPython) {
  & $venvPython -c "import sys" 2>$null
  $venvValido = ($LASTEXITCODE -eq 0)
}
if (-not $venvValido) {
  # Un .venv copiado de otro PC no funciona: se borra y se crea de nuevo.
  if (Test-Path "$nominas\.venv") { Remove-Item "$nominas\.venv" -Recurse -Force }
  & $python.Exe @($python.Args) -m venv "$nominas\.venv"
  if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el entorno virtual." }
  Ok "Entorno virtual creado"
} else {
  Ok "Entorno virtual existente"
}
& $venvPython -m pip install --disable-pip-version-check -q -r "$nominas\requirements.txt"
if ($LASTEXITCODE -ne 0) { throw "Fallo instalando las dependencias de requirements.txt." }
Push-Location $nominas
try {
  & $venvPython -c "import flask_app" 2>$null
  if ($LASTEXITCODE -ne 0) { throw "La app de Nominas no arranca (import flask_app fallo)." }
} finally { Pop-Location }
Ok "Dependencias instaladas y app verificada"

# --- 4. Outlook -------------------------------------------------------------
Paso "Comprobando Outlook"
$outlook = $null
try { $outlook = New-Object -ComObject Outlook.Application } catch { }
if ($outlook) {
  Ok "Outlook de escritorio disponible"
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($outlook)
} else {
  Aviso "No se detecta Outlook de escritorio (clasico). Sin el, el panel genera los PDFs pero no puede enviar correos. El 'nuevo Outlook' no sirve."
}

# --- 5. Ayudante: inicio automatico y arranque -------------------------------
Paso "Configurando el ayudante de carpetas"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$ayudante\carpeta_helper_instalar_inicio.ps1" | Out-Null
Ok "Acceso directo de Inicio creado (arranca solo al iniciar sesion)"

$enMarcha = [bool](Get-NetTCPConnection -LocalPort 51837 -State Listen -ErrorAction SilentlyContinue)
if (-not $enMarcha) {
  Start-Process wscript.exe -ArgumentList "`"$ayudante\carpeta_helper_start.vbs`""
  Start-Sleep -Seconds 3
  $enMarcha = [bool](Get-NetTCPConnection -LocalPort 51837 -State Listen -ErrorAction SilentlyContinue)
}
if ($enMarcha) { Ok "Ayudante en marcha (127.0.0.1:51837)" } else { Aviso "El ayudante no responde todavia; reinicia sesion o abre ayudante\carpeta_helper_start.vbs." }

# --- Resumen ----------------------------------------------------------------
Write-Host ""
Write-Host "Instalacion terminada." -ForegroundColor Green
foreach ($a in $avisos) { Write-Host " - $a" -ForegroundColor Yellow }
Write-Host ""
Write-Host "Falta un unico paso manual, en Chrome:"
Write-Host " 1. Abre coordinacion.edpsl.es e inicia sesion."
Write-Host " 2. Usa algo que llame al ayudante (abrir la carpeta de una persona en Personal,"
Write-Host "    o Gestion > Enviar nominas) y, cuando Chrome pregunte, permite el acceso a la red local."
Write-Host " Recomendado: la primera prueba de 'Enviar nominas' con 'Enviar por Outlook' desmarcado."

