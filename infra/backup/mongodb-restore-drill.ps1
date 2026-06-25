param(
  [Parameter(Mandatory = $true)][string]$MongoUri,
  [Parameter(Mandatory = $true)][string]$EncryptedArchive,
  [Parameter(Mandatory = $true)][string]$EncryptionPassword,
  [Parameter(Mandatory = $true)][string]$WorkDir
)

$ErrorActionPreference = "Stop"
$archive = Join-Path $WorkDir "restore-drill.archive.gz"

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in "$EncryptedArchive" -out "$archive" -pass "pass:$EncryptionPassword"
mongorestore --uri="$MongoUri" --archive="$archive" --gzip --drop
Remove-Item -LiteralPath "$archive"

Write-Output "Restore drill completed against $MongoUri"
