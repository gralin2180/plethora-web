# Install all Plethora Office desktop apps
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$apps = @("slack", "scout", "draft", "grid", "trace", "nook", "mail")

foreach ($app in $apps) {
  $dir = Join-Path $root $app
  if (-not (Test-Path $dir)) { Write-Host "Skip missing $app" -ForegroundColor Yellow; continue }
  Write-Host "`n=== $app ===" -ForegroundColor Cyan
  Set-Location $dir
  npm install
  if (-not (Test-Path "node_modules\electron\dist\electron.exe")) {
    node node_modules/electron/install.js
    if (-not (Test-Path "node_modules\electron\dist\electron.exe")) {
      $zip = Get-ChildItem "$env:LOCALAPPDATA\electron\Cache" -Recurse -Filter "electron-v34*.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($zip) {
        New-Item -ItemType Directory -Path "node_modules\electron\dist" -Force | Out-Null
        Expand-Archive -Path $zip.FullName -DestinationPath "node_modules\electron\dist" -Force
      }
    }
  }
  npm run build:renderer
  npm run build:electron
  Write-Host "Built $app" -ForegroundColor Green
}

Set-Location $root
Write-Host "`nDone. Launch with: npm run start (inside each app folder)" -ForegroundColor Green
