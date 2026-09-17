# Ayudante local para el boton "Abrir" de la ficha de Personal en
# coordinacion.edpsl.es. Un navegador no puede navegar a file:// desde una
# pagina http(s) (Chrome responde "Not allowed to load local resource"), asi
# que este script escucha en 127.0.0.1 y abre el Explorador real cuando la
# app se lo pide. Solo acepta conexiones locales (127.0.0.1) y solo atiende
# peticiones cuyo origen sea la propia app.
#
# Requiere Windows + PowerShell (ya viene con el sistema, sin instalar nada
# mas). Pensado para arrancar solo al encender el PC via
# carpeta_helper_start.vbs (ver carpeta_helper_instalar_inicio.ps1).

$ErrorActionPreference = "Stop"

$port = 51837
$allowedOrigins = @(
  "https://coordinacion.edpsl.es"
)

function Test-AllowedOrigin($origin) {
  if (-not $origin) {
    return $false
  }
  if ($allowedOrigins -contains $origin) {
    return $true
  }
  # Desarrollo local: python -m http.server en cualquier puerto de localhost/127.0.0.1.
  return $origin -match '^https?://(localhost|127\.0\.0\.1)(:\d+)?$'
}

function Get-QueryParam($RawUrl, $Name) {
  $queryIndex = $RawUrl.IndexOf("?")
  if ($queryIndex -lt 0) {
    return $null
  }
  $queryString = $RawUrl.Substring($queryIndex + 1)
  foreach ($pair in $queryString -split "&") {
    $parts = $pair -split "=", 2
    if ($parts.Length -eq 2 -and $parts[0] -eq $Name) {
      return [System.Uri]::UnescapeDataString($parts[1])
    }
  }
  return $null
}

Add-Type -Name Win32Foreground -Namespace CarpetaHelper -MemberDefinition @"
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, int dwFlags, int dwExtraInfo);
"@

# Windows bloquea SetForegroundWindow a procesos que no recibieron el ultimo
# input (evita que apps en segundo plano se roben el foco) — y este ayudante
# siempre esta en segundo plano. Abrir la carpeta basta para que aparezca,
# pero queda detras de Chrome. Se busca la ventana del Explorador recien
# abierta (via Shell.Application, con reintentos porque tarda en aparecer) y
# se fuerza al frente con el truco de simular una pulsacion de Alt, que
# "desbloquea" la siguiente llamada a SetForegroundWindow.
function Set-ExplorerWindowForeground($carpeta) {
  $normalizado = $carpeta.TrimEnd('\').ToLowerInvariant()
  $shell = New-Object -ComObject Shell.Application
  for ($intento = 0; $intento -lt 20; $intento++) {
    foreach ($ventana in @($shell.Windows())) {
      try {
        $rutaVentana = $ventana.Document.Folder.Self.Path
      } catch {
        continue
      }
      if ($rutaVentana -and $rutaVentana.TrimEnd('\').ToLowerInvariant() -eq $normalizado) {
        $hwnd = [IntPtr]$ventana.HWND
        if ([CarpetaHelper.Win32Foreground]::IsIconic($hwnd)) {
          [CarpetaHelper.Win32Foreground]::ShowWindow($hwnd, 9) | Out-Null # SW_RESTORE
        }
        [CarpetaHelper.Win32Foreground]::keybd_event(0x12, 0, 0x1, 0) # Alt abajo
        [CarpetaHelper.Win32Foreground]::keybd_event(0x12, 0, 0x3, 0) # Alt arriba
        [CarpetaHelper.Win32Foreground]::SetForegroundWindow($hwnd) | Out-Null
        return $true
      }
    }
    Start-Sleep -Milliseconds 150
  }
  return $false
}

# Version para el documento que se abre con su programa por defecto (Word,
# Acrobat/Edge, Fotos...), no siempre Explorador. NO se basa en el proceso
# que lanza Start-Process: muchos visores (Edge/Acrobat con el lector ya
# abierto, apps modernas empaquetadas) reutilizan una ventana existente y el
# proceso recien lanzado termina casi al instante — leer su MainWindowHandle
# en ese momento lanza una excepcion ("el proceso ya ha terminado") aunque el
# documento se abra bien. En su lugar se buscan, entre TODAS las ventanas
# visibles, las que su titulo contenga el nombre del archivo (la inmensa
# mayoria de apps lo ponen en la barra de titulo), con reintentos porque
# tarda un poco en aparecer/actualizarse.
function Set-DocumentWindowForeground($rutaCompleta) {
  $nombreArchivo = [System.IO.Path]::GetFileName($rutaCompleta)
  $nombreSinExtension = [System.IO.Path]::GetFileNameWithoutExtension($rutaCompleta)
  for ($intento = 0; $intento -lt 15; $intento++) {
    Start-Sleep -Milliseconds 200
    $coincidencia = $null
    try {
      $coincidencia = Get-Process | Where-Object {
        $_.MainWindowHandle -ne [IntPtr]::Zero -and
        $_.MainWindowTitle -and
        ($_.MainWindowTitle.Contains($nombreArchivo) -or $_.MainWindowTitle.Contains($nombreSinExtension))
      } | Select-Object -First 1
    } catch {
      continue
    }
    if ($coincidencia) {
      $hwnd = $coincidencia.MainWindowHandle
      if ([CarpetaHelper.Win32Foreground]::IsIconic($hwnd)) {
        [CarpetaHelper.Win32Foreground]::ShowWindow($hwnd, 9) | Out-Null # SW_RESTORE
      }
      [CarpetaHelper.Win32Foreground]::keybd_event(0x12, 0, 0x1, 0) # Alt abajo
      [CarpetaHelper.Win32Foreground]::keybd_event(0x12, 0, 0x3, 0) # Alt arriba
      [CarpetaHelper.Win32Foreground]::SetForegroundWindow($hwnd) | Out-Null
      return $true
    }
  }
  return $false
}

function Send-JsonResponse($context, $statusCode, $bodyObject, $allowOrigin) {
  $response = $context.Response
  $response.StatusCode = $statusCode
  $response.ContentType = "application/json; charset=utf-8"
  if ($allowOrigin) {
    $response.Headers.Add("Access-Control-Allow-Origin", $allowOrigin)
    $response.Headers.Add("Access-Control-Allow-Private-Network", "true")
    $response.Headers.Add("Vary", "Origin")
  }
  $json = $bodyObject | ConvertTo-Json -Compress -Depth 6
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
  $listener.Start()
} catch {
  # Puerto ya en uso: seguramente ya hay una instancia corriendo. Salir sin
  # ruido en vez de fallar de forma visible en segundo plano.
  exit 0
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $origin = $request.Headers["Origin"]
  $allowOrigin = $null
  if (Test-AllowedOrigin $origin) {
    $allowOrigin = $origin
  }

  try {
    if ($request.HttpMethod -eq "OPTIONS") {
      $response = $context.Response
      $response.StatusCode = 204
      if ($allowOrigin) {
        $response.Headers.Add("Access-Control-Allow-Origin", $allowOrigin)
        $response.Headers.Add("Access-Control-Allow-Private-Network", "true")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        $response.Headers.Add("Vary", "Origin")
      }
      $response.OutputStream.Close()
      continue
    }

    if (-not $allowOrigin) {
      Send-JsonResponse $context 403 @{ ok = $false; error = "Origen no permitido" } $null
      continue
    }

    $path = $request.Url.AbsolutePath

    if ($path -eq "/ping") {
      Send-JsonResponse $context 200 @{ ok = $true } $allowOrigin
      continue
    }

    if ($path -eq "/abrir" -and $request.HttpMethod -eq "GET") {
      # $request.QueryString decodifica con la codificacion ANSI del sistema
      # en vez de UTF-8 (HttpListenerRequest.ContentEncoding sin Content-Type
      # cae a Encoding.Default), y descuadra tildes/ñ. Se parsea a mano con
      # Uri.UnescapeDataString, que si decodifica los %XX como UTF-8.
      $ruta = Get-QueryParam -RawUrl $request.RawUrl -Name "ruta"
      if ([string]::IsNullOrWhiteSpace($ruta)) {
        Send-JsonResponse $context 400 @{ ok = $false; error = "Falta la ruta de la carpeta" } $allowOrigin
        continue
      }
      if (Test-Path -LiteralPath $ruta -PathType Container) {
        $rutaCompleta = (Resolve-Path -LiteralPath $ruta).ProviderPath
        Start-Process -FilePath "explorer.exe" -ArgumentList "`"$rutaCompleta`""
        Set-ExplorerWindowForeground $rutaCompleta | Out-Null
        Send-JsonResponse $context 200 @{ ok = $true } $allowOrigin
      } elseif (Test-Path -LiteralPath $ruta -PathType Leaf) {
        # Documento suelto (listado de la carpeta): se abre con su programa
        # por defecto, no con el Explorador. Sin -PassThru: para varios tipos
        # de documento ShellExecute no devuelve un handle de proceso real y
        # -PassThru directamente falla ("el sistema no encuentra toda la
        # informacion necesaria"), asi que el proceso lanzador no se usa para
        # nada — el primer plano se busca aparte por titulo de ventana.
        $rutaCompleta = (Resolve-Path -LiteralPath $ruta).ProviderPath
        Start-Process -FilePath $rutaCompleta
        Set-DocumentWindowForeground $rutaCompleta | Out-Null
        Send-JsonResponse $context 200 @{ ok = $true } $allowOrigin
      } else {
        Send-JsonResponse $context 200 @{ ok = $false; error = "No existe: $ruta" } $allowOrigin
      }
      continue
    }

    if ($path -eq "/listar" -and $request.HttpMethod -eq "GET") {
      $ruta = Get-QueryParam -RawUrl $request.RawUrl -Name "ruta"
      if ([string]::IsNullOrWhiteSpace($ruta)) {
        Send-JsonResponse $context 400 @{ ok = $false; error = "Falta la ruta de la carpeta" } $allowOrigin
        continue
      }
      if (-not (Test-Path -LiteralPath $ruta -PathType Container)) {
        Send-JsonResponse $context 200 @{ ok = $false; error = "La carpeta no existe: $ruta" } $allowOrigin
        continue
      }
      $archivos = @(
        Get-ChildItem -LiteralPath $ruta -File | Sort-Object Name | ForEach-Object {
          @{ nombre = $_.Name; ruta = $_.FullName }
        }
      )
      Send-JsonResponse $context 200 @{ ok = $true; archivos = $archivos } $allowOrigin
      continue
    }

    Send-JsonResponse $context 404 @{ ok = $false; error = "No encontrado" } $allowOrigin
  } catch {
    Send-JsonResponse $context 500 @{ ok = $false; error = "Error interno del ayudante" } $allowOrigin
  }
}
