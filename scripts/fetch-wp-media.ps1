# Windows PowerShell 5.1 reads files as ANSI by default, which mangles the Greek filenames in the list.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
# Downloads the media files listed by scripts/import-wp.mjs (supabase/import/wp-media.txt) into public/img/wp/.
# Run from the repo root in PowerShell after import-wp.mjs:  .\scripts\fetch-wp-media.ps1
$list = Join-Path $PSScriptRoot "..\supabase\import\wp-media.txt"
$dst = Join-Path $PSScriptRoot "..\public\img\wp"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$urls = Get-Content $list -Encoding UTF8 | Where-Object { $_.Trim() -ne "" }
$i = 0
foreach ($u in $urls) {
  $i++
  $name = [System.Uri]::UnescapeDataString(($u -split "/")[-1])
  $out = Join-Path $dst $name
  if (Test-Path $out) { Write-Host "[$i/$($urls.Count)] exists  $name"; continue }
  try {
    # percent-encode the path so filenames with Greek characters or spaces resolve
    $uri = [System.Uri]$u
    $enc = $uri.Scheme + "://" + $uri.Host + ((($uri.AbsolutePath -split "/") | ForEach-Object { [System.Uri]::EscapeDataString([System.Uri]::UnescapeDataString($_)) }) -join "/")
    Invoke-WebRequest -Uri $enc -OutFile $out -UseBasicParsing -TimeoutSec 60
    Write-Host "[$i/$($urls.Count)] ok      $name"
  } catch {
    Write-Host "[$i/$($urls.Count)] FAILED  $u  ($($_.Exception.Message))" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 150
}
$size = (Get-ChildItem $dst -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Done → $dst  ($([math]::Round($size,1)) MB σε $((Get-ChildItem $dst -File).Count) αρχεία)"
