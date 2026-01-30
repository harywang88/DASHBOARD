@echo off
REM Download and install ImageMagick
setlocal enabledelayedexpansion

echo Downloading ImageMagick...
set URL=https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-29-Q16-x64-dll.exe
set INSTALLER=C:\temp\ImageMagick-installer.exe

if not exist C:\temp (mkdir C:\temp)

REM Use PowerShell to download
powershell -NoProfile -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%URL%', '%INSTALLER%')}"

if exist %INSTALLER% (
    echo Installing ImageMagick...
    %INSTALLER% /quiet /norestart
    echo Installation started!
    echo Waiting for installation to complete...
    timeout /t 30 /nobreak
    echo Done! ImageMagick should now be installed.
) else (
    echo Download failed!
)

endlocal
