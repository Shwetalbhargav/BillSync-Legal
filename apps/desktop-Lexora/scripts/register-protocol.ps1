$ErrorActionPreference = "Stop"

$appRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$electronExe = Join-Path $appRoot "node_modules\electron\dist\electron.exe"

if (-not (Test-Path $electronExe)) {
  throw "Electron executable not found at $electronExe. Run npm install in apps\desktop-Lexora first."
}

$protocolRoot = "HKCU:\Software\Classes\lexora-desktop"
$commandKey = Join-Path $protocolRoot "shell\open\command"
$iconKey = Join-Path $protocolRoot "DefaultIcon"

New-Item -Path $protocolRoot -Force | Out-Null
New-ItemProperty -Path $protocolRoot -Name "(default)" -Value "URL:Lexora Desktop Agent" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $protocolRoot -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null

New-Item -Path $iconKey -Force | Out-Null
New-ItemProperty -Path $iconKey -Name "(default)" -Value "`"$electronExe`",0" -PropertyType String -Force | Out-Null

New-Item -Path $commandKey -Force | Out-Null
New-ItemProperty -Path $commandKey -Name "(default)" -Value "`"$electronExe`" `"$appRoot`" `"%1`"" -PropertyType String -Force | Out-Null

Write-Host "Registered lexora-desktop:// to $electronExe"
