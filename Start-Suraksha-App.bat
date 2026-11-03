@echo off
title SURAKSHA ALERT Launcher
cd /d "%~dp0"

echo ======================================================
echo   Launching SURAKSHA ALERT - Standalone App Mode...
echo ======================================================
echo.

:: Start Node server in background if not already running
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Local server is already running!
) else (
    echo Starting background server on port 3000...
    start /b "" node server.js
    timeout /t 2 /nobreak >nul
)

:: Try opening in Microsoft Edge App Mode, fallback to Chrome, fallback to default
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
) else (
    start http://localhost:3000
)

echo.
echo Application window opened successfully!
echo You can keep this launcher running or minimize it.
echo Press any key to exit launcher (server will stop).
pause >nul
taskkill /F /IM node.exe >nul 2>&1
