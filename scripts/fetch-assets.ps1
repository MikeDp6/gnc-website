# Greek filenames need UTF-8 both on the console and in the request URL.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# Downloads photos from gnc3on3.gr into public/img/gnc (run from the repo root in PowerShell: .\scripts\fetch-assets.ps1)
$dst = Join-Path $PSScriptRoot "..\public\img\gnc"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$urls = @(
  "https://gnc3on3.gr/wp-content/uploads/2025/02/006-768x576.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/0071.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/008.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/009-768x512.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/010-768x512.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/SCHELDE-240x300.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/black-17.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/Εικόνα1.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/Εικόνα4.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/ΟΘΟΝΗ-768x513.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/02/ολυμπιακοθ_bg_removed.png-300x300.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/03/IMG_6714.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_agiosnikolaos-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_agrinio-min.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_aigio-1-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_chania-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_irakleio-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_kavala-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_komotini-1-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_patra2-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_rafina-min.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_rethymno-min.png",
  "https://gnc3on3.gr/wp-content/uploads/2025/10/gnc3on3_thessaloniki-min.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/08/gnc-3on3-skala-post-scaled.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/08/gnc-pefki-3x3-1-scaled.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/08/gnc-vonitsa-apologistiko-scaled.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/09/gnc-patra-1-scaled.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/09/gnc-patra-819x1024.jpg",
  "https://gnc3on3.gr/wp-content/uploads/2026/09/gnc-patra-scaled.jpg"
)
foreach ($u in $urls) {
  $name = [System.Uri]::UnescapeDataString(($u -split "/")[-1])
  $out = Join-Path $dst $name
  if (Test-Path $out) { Write-Host "skip  $name"; continue }
  try {
    $uri = [System.Uri]$u
    $enc = $uri.Scheme + "://" + $uri.Host + ((($uri.AbsolutePath -split "/") | ForEach-Object { [System.Uri]::EscapeDataString([System.Uri]::UnescapeDataString($_)) }) -join "/")
    Invoke-WebRequest -Uri $enc -OutFile $out -UseBasicParsing -TimeoutSec 60
    Write-Host "ok    $name"
  } catch { Write-Host "FAIL  $name  $($_.Exception.Message)" -ForegroundColor Red }
  Start-Sleep -Milliseconds 200
}
$n = (Get-ChildItem $dst -File).Count
Write-Host "Done → $dst  ($n αρχεία)"
