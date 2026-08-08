@echo off
cd /d "%~dp0"
echo Starting Plethora...
start "" msedge "http://localhost:3000"
call npm run dev
pause
