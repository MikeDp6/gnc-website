# Downloads the sponsor images from gnc3on3.gr into public/img/gnc/sponsors/.
# Run from the repo root:  .\scripts\fetch-sponsors.ps1
# Files are named <year-month>-<original> so the numbered ones do not collide.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dst = Join-Path $PSScriptRoot "..\public\img\gnc\sponsors"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$urls = @(
  "https://gnc3on3.gr/wp-content/uploads/2025/08/sponsors_website-2.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/07/sponsors_website-1.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/05/sponsors_website-1.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/05/sponsors_website.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/03/sponsors_website.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/10.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/11.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/8.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/7.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/6.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/5.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/3.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/2.png",
  "https://gnc3on3.gr/wp-content/uploads/2024/06/1.png"
)
foreach ($u in $urls) {
  $parts = $u -split "/"
  $name = "$($parts[-3])-$($parts[-2])-$($parts[-1])"
  $out = Join-Path $dst $name
  if (Test-Path $out) { Write-Host "skip  $name"; continue }
  try {
    Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing -TimeoutSec 60
    Write-Host "ok    $name"
  } catch { Write-Host "FAIL  $name  $($_.Exception.Message)" -ForegroundColor Red }
  Start-Sleep -Milliseconds 200
}
$n = (Get-ChildItem $dst -File).Count
Write-Host "Done -> $dst  ($n files)"
