# Downloads the media files listed by scripts/import-wp.mjs (supabase/import/wp-media.txt) into public/img/wp/.
# Run from the repo root in PowerShell after import-wp.mjs:  .\scripts\fetch-wp-media.ps1
$list = Join-Path $PSScriptRoot "..\supabase\import\wp-media.txt"
$dst = Join-Path $PSScriptRoot "..\public\img\wp"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$urls = Get-Content $list | Where-Object { $_.Trim() -ne "" }
$i = 0
foreach ($u in $urls) {
  $i++
  $name = [System.Uri]::UnescapeDataString(($u -split "/")[-1])
  $out = Join-Path $dst $name
  if (Test-Path $out) { Write-Host "[$i/$($urls.Count)] exists  $name"; continue }
  try {
    Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing -TimeoutSec 60
    Write-Host "[$i/$($urls.Count)] ok      $name"
  } catch {
    Write-Host "[$i/$($urls.Count)] FAILED  $u  ($($_.Exception.Message))" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 400
}
Write-Host "Done → $dst"
