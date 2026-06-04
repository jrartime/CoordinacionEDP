param(
  [switch]$SkipPublish
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$publishRoot = Join-Path $root "publish"

function Invoke-Step($Name, $ScriptBlock) {
  Write-Host "== $Name =="
  & $ScriptBlock
}

Invoke-Step "JavaScript syntax" {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Write-Host "Node no esta disponible; se omite la comprobacion de sintaxis."
    return
  }

  $files = @(
    "coordinacion/app.js",
    "curriculos/app.js",
    "programacion/app.js",
    "concilia/app.js",
    "shared/supabase-client.js",
    "shared/auth.js"
  )

  foreach ($file in $files) {
    $path = Join-Path $root $file
    if (-not (Test-Path -LiteralPath $path)) {
      throw "No se encontro $file"
    }

    & node --check $path
  }
}

Invoke-Step "Python syntax" {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    Write-Host "Python no esta disponible; se omite la comprobacion de sintaxis."
    return
  }

  Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.py" |
    ForEach-Object {
      & python -m py_compile $_.FullName
    }
}

Invoke-Step "Codificacion visible" {
  $patterns = @("Ã", "Â", "ï»¿", "Ì", "Í")
  $sourceFiles = Get-ChildItem -LiteralPath $root -Recurse -File |
    Where-Object {
      $_.FullName -notlike (Join-Path $publishRoot "*") -and
      $_.FullName -notlike (Join-Path $root ".git\*") -and
      $_.Extension -in @(".html", ".js", ".css", ".md", ".sql", ".ps1")
    }

  foreach ($file in $sourceFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    foreach ($pattern in $patterns) {
      if ($content.Contains($pattern)) {
        throw "Secuencia de codificacion sospechosa '$pattern' en $($file.FullName)"
      }
    }
  }
}

if (-not $SkipPublish) {
  Invoke-Step "Publish shared paths" {
    if (-not (Test-Path -LiteralPath $publishRoot)) {
      throw "No existe publish/. Ejecuta scripts/publish.ps1 primero."
    }

    $sites = @("coordinacion", "curriculos", "programacion", "concilia")
    foreach ($site in $sites) {
      $siteRoot = Join-Path $publishRoot $site
      $sharedRoot = Join-Path $siteRoot "shared"
      if (-not (Test-Path -LiteralPath $sharedRoot)) {
        throw "Falta shared/ en publish/$site"
      }

      $index = Join-Path $siteRoot "index.html"
      if ((Test-Path -LiteralPath $index) -and
          [System.IO.File]::ReadAllText($index).Contains("../shared/")) {
        throw "Ruta ../shared/ encontrada en publish/$site/index.html"
      }
    }
  }
}

Write-Host "Comprobaciones completadas."
