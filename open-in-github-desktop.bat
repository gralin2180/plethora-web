@echo off
echo Opening Plethora in GitHub Desktop...
start "" "%LOCALAPPDATA%\GitHubDesktop\GitHubDesktop.exe"
timeout /t 2 /nobreak >nul
echo.
echo Then in GitHub Desktop:
echo   File ^> Add local repository
echo   Path: C:\Other Projects\Plethora\web
echo   Click Add repository
echo.
echo If it says "does not appear to be a git repository", run:
echo   cd /d "C:\Other Projects\Plethora\web"
echo   git status
echo.
pause
