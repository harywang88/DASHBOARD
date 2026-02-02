@echo off
echo.
echo =========================================
echo    Harywang Dashboard - Starting...
echo =========================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Starting all services...
node start.js

pause
