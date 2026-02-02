@echo off
REM CloudConvert-Local Tools Installer for Windows

echo.
echo =========================================
echo CloudConvert-Local Tools Installer
echo =========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must run as Administrator
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo Checking installed tools...
echo.

REM Check ImageMagick
echo Checking ImageMagick...
magick --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] ImageMagick found
) else (
    echo [MISSING] ImageMagick
    echo.
    echo Download from: https://imagemagick.org/script/download.php#windows
    echo Run the .exe installer
    echo.
)

REM Check FFmpeg
echo Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] FFmpeg found
) else (
    echo [MISSING] FFmpeg
    echo.
    echo Option 1: Download from https://ffmpeg.org/download.html
    echo Option 2: Use WinGet: winget install FFmpeg
    echo Option 3: Use Scoop: scoop install ffmpeg
    echo.
)

REM Check LibreOffice
echo Checking LibreOffice...
soffice --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] LibreOffice found
) else (
    echo [MISSING] LibreOffice
    echo.
    echo Download from: https://www.libreoffice.org/download
    echo Run the .msi installer
    echo.
)

REM Check 7-Zip
echo Checking 7-Zip...
7z >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] 7-Zip found
) else (
    echo [MISSING] 7-Zip
    echo.
    echo Download from: https://www.7-zip.org/download.html
    echo Run the .exe installer
    echo.
)

echo.
echo =========================================
echo Tool Installation Complete
echo =========================================
echo.
echo After installing all tools, please:
echo 1. Restart PowerShell/CMD
echo 2. Run: npm start
echo 3. Open: http://localhost:3000
echo.

pause
