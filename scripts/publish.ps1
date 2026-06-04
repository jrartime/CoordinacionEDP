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
    Files = @("index.html", "app.js", "styles.css", "config.js", ".htaccess", "icons.svg", "EDP.jpg")
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
    Files = @("index.html", "app.js", "styles.css", "config.js", ".htaccess", "README.md", "icons.svg", "EDP.jpg")
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

  $sharedDestination = Join-Path $destination "shared"
  if (Test-Path -LiteralPath $sharedDestination) {
    Remove-Item -LiteralPath $sharedDestination -Recurse -Force
  }
  Copy-Item -LiteralPath $sharedSource -Destination $sharedDestination -Recurse -Force

  $publishedIndex = Join-Path $destination "index.html"
  $indexContent = [System.IO.File]::ReadAllText($publishedIndex)
  $indexContent = $indexContent.Replace("../shared/", "./shared/")
  [System.IO.File]::WriteAllText($publishedIndex, $indexContent, [System.Text.Encoding]::UTF8)

  Write-Host "Publicado $($site.Name) -> $destination"
}
