' Lanza carpeta_helper.ps1 en segundo plano, sin ventana visible.
' Pensado para ejecutarse via un acceso directo en la carpeta de Inicio de
' Windows (ver carpeta_helper_instalar_inicio.ps1). Doble clic aqui tambien
' sirve para arrancarlo sin reiniciar el PC.

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1Path = scriptDir & "\carpeta_helper.ps1"

Set shell = CreateObject("WScript.Shell")
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1Path & """"
shell.Run command, 0, False
