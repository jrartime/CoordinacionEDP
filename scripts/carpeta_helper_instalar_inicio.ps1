# Crea un acceso directo en la carpeta de Inicio de Windows del usuario
# actual para que el ayudante de carpetas (carpeta_helper.ps1) arranque solo
# en cada inicio de sesion. Ejecutar una sola vez por PC/usuario.
#
# Para deshacerlo: borrar "EDP Carpeta Helper.lnk" de esa carpeta de Inicio
# (shell:startup en el explorador, o la ruta que imprime este script).

$ErrorActionPreference = "Stop"

$vbsPath = Join-Path $PSScriptRoot "carpeta_helper_start.vbs"
if (-not (Test-Path -LiteralPath $vbsPath)) {
  throw "No se encontro $vbsPath"
}

$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "EDP Carpeta Helper.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Ayudante local para abrir carpetas desde Coordinacion EDP"
$shortcut.Save()

Write-Host "Acceso directo creado en: $shortcutPath"
Write-Host "Arrancara solo en el proximo inicio de sesion."
Write-Host ""
Write-Host "Para arrancarlo ahora mismo sin reiniciar, ejecuta:"
Write-Host "  wscript.exe `"$vbsPath`""
