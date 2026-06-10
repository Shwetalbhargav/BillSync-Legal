param(
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

if (-not $version -or $version -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') {
  throw "manifest.json version must be a Chrome-compatible version such as 1.0.1"
}

$requiredFiles = @(
  "manifest.json",
  "background.js",
  "captureCore.js",
  "content.js",
  "gmailAdapter.js",
  "options.html",
  "options.js",
  "research.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $root $file
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing release file: $file"
  }
}

$releaseRoot = Join-Path $root $OutputDir
$staging = Join-Path $releaseRoot "billsync-capture-$version"
$zipPath = Join-Path $releaseRoot "billsync-capture-$version.zip"

if (Test-Path -LiteralPath $staging) {
  Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $staging | Out-Null

foreach ($file in $requiredFiles) {
  $source = Join-Path $root $file
  $target = Join-Path $staging $file
  $targetDir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force

Write-Host "Packaged BillSync Capture $version"
Write-Host $zipPath
