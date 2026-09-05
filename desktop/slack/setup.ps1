# Run once on your PC to install Electron + build Plethora Slack
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Downloading Electron binary..." -ForegroundColor Cyan
node node_modules/electron/install.js

if (-not (Test-Path "node_modules\electron\dist\electron.exe")) {
  Write-Host "ERROR: electron.exe missing. Try:" -ForegroundColor Red
  Write-Host "  Remove-Item -Recurse node_modules; npm install" -ForegroundColor Yellow
  exit 1
}

Write-Host "Building..." -ForegroundColor Cyan
npm run build:electron
npm run build:renderer

Write-Host "Launching Plethora Slack..." -ForegroundColor Green
npm run start
