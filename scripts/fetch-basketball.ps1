# One file, kept apart because its name on the server is in Greek and PowerShell 5.1 reads .ps1 as ANSI:
# the URL below is percent-encoded so this script stays pure ASCII. Run from the repo root:
#   .\scripts\fetch-basketball.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dst = Join-Path $PSScriptRoot "..\public\img\gnc"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$u = "https://gnc3on3.gr/wp-content/uploads/2025/02/%CE%BF%CE%BB%CF%85%CE%BC%CF%80%CE%B9%CE%B1%CE%BA%CE%BF%CE%B8_bg_removed.png.png"
$out = Join-Path $dst "basketball-olympic.png"
try {
  Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing -TimeoutSec 60
  Write-Host "ok    basketball-olympic.png"
} catch { Write-Host "FAIL  $($_.Exception.Message)" -ForegroundColor Red }
