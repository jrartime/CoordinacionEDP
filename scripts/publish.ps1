param(
  [switch]$SkipConfig
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$publishRoot = Join-Path $root "publish"
$sharedSource = Join-Path $root "shared"

if (-not (Test-Path -LiteralPath $sharedSource)) {
  throw "No se encontro la carpeta compartida requerida: $sharedSource"
}

$sites = @(
  @{
    Name = "coordinacion"
    Source = Join-Path $root "coordinacion"
    Files = @("index.html", "app.js", "styles.css", "concilia-integrated.js", "concilia-integrated.css", "config.js", ".htaccess", "icons.svg", "EDP.jpg")
  },
  @{
    Name = "curriculos"
    Source = Join-Path $root "curriculos"
    Files = @("index.html", "app.js", "styles.css", "config.js", ".htaccess", "DEPLOY_WORDPRESS.md", "EDP.jpg")
  },
  @{
    Name = "programacion"
    Source = Join-Path $root "programacion"
    Files = @("index.html", "app.js", "styles.css", "config.js", ".htaccess", "EDP.jpg")
  },
  @{
    Name = "concilia"
    Source = Join-Path $root "concilia"
    Files = @("index.html", "app.js", "styles.css", "disponibilidad.html", "disponibilidad.js", "disponibilidad.css", "config.js", ".htaccess", "README.md", "icons.svg", "EDP.jpg")
    Directories = @("carnes")
  },
  @{
    Name = "pequecampus"
    Source = Join-Path $root "pequecampus"
    Files = @("index.html", "app.js", "styles.css", "config.js", ".htaccess", "plantilla.jpeg", "plantilla-pequecampus.png", "logo-oviedo-deportes.png", "logo-ciudad-europea-deporte.png")
  }
)

New-Item -ItemType Directory -Force -Path $publishRoot | Out-Null

foreach ($site in $sites) {
  $destination = Join-Path $publishRoot $site.Name
  New-Item -ItemType Directory -Force -Path $destination | Out-Null

  foreach ($file in $site.Files) {
    if ($SkipConfig -and $file -eq "config.js") {
      continue
    }

    $sourceFile = Join-Path $site.Source $file
    if (-not (Test-Path -LiteralPath $sourceFile)) {
      throw "No se encontro el archivo requerido: $sourceFile"
    }

    Copy-Item -LiteralPath $sourceFile -Destination (Join-Path $destination $file) -Force
  }

  $directories = @()
  if ($site.ContainsKey("Directories")) {
    $directories = $site.Directories
  }

  foreach ($directory in $directories) {
    $sourceDirectory = Join-Path $site.Source $directory
    if (-not (Test-Path -LiteralPath $sourceDirectory)) {
      throw "No se encontro la carpeta requerida: $sourceDirectory"
    }

    $destinationDirectory = Join-Path $destination $directory
    if (Test-Path -LiteralPath $destinationDirectory) {
      Remove-Item -LiteralPath $destinationDirectory -Recurse -Force
    }
    Copy-Item -LiteralPath $sourceDirectory -Destination $destinationDirectory -Recurse -Force
  }

  $sharedDestination = Join-Path $destination "shared"
  if (Test-Path -LiteralPath $sharedDestination) {
    Remove-Item -LiteralPath $sharedDestination -Recurse -Force
  }
  Copy-Item -LiteralPath $sharedSource -Destination $sharedDestination -Recurse -Force

  Get-ChildItem -LiteralPath $destination -Filter "*.html" -Recurse |
    ForEach-Object {
      $htmlContent = [System.IO.File]::ReadAllText($_.FullName)
      $relativeDirectory = $_.DirectoryName.Substring($destination.Length).TrimStart("\", "/")
      $depth = 0
      if ($relativeDirectory) {
        $depth = ($relativeDirectory -split "[\\/]").Count
      }
      $sharedPath = if ($depth -eq 0) { "./shared/" } else { ("../" * $depth) + "shared/" }
      $htmlContent = $htmlContent.Replace("../../shared/", $sharedPath)
      $htmlContent = $htmlContent.Replace("../shared/", $sharedPath)
      [System.IO.File]::WriteAllText($_.FullName, $htmlContent, [System.Text.Encoding]::UTF8)
    }

  Write-Host "Publicado $($site.Name) -> $destination"
}
