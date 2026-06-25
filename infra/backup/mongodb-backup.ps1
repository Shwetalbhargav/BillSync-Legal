param(
  [Parameter(Mandatory = $true)][string]$MongoUri,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [Parameter(Mandatory = $true)][string]$EncryptionPassword
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archive = Join-Path $OutDir "lexora-mongodb-$timestamp.archive.gz"
$encrypted = "$archive.enc"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
mongodump --uri="$MongoUri" --archive="$archive" --gzip
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 -in "$archive" -out "$encrypted" -pass "pass:$EncryptionPassword"
Remove-Item -LiteralPath "$archive"

Write-Output $encrypted
