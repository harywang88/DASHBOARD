@echo off
title Harywang Deploy to VPS
color 0A

echo ========================================
echo    HARYWANG DASHBOARD - ONE CLICK DEPLOY
echo ========================================
echo.

:: Git commit dan push dulu
echo [1/3] Commit dan Push ke GitHub...
git add -A
git commit -m "auto: Deploy update %date% %time%"
git push origin main
if errorlevel 1 (
    echo ERROR: Git push gagal!
    pause
    exit /b 1
)

echo.
echo [2/3] Connecting ke VPS...
echo.
echo ==========================================
echo  PENTING: Ketik password VPS lalu ENTER
echo ==========================================
echo.

:: SSH ke VPS dan jalankan deploy
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 root@144.217.13.125 "cd /var/www/harywang-dashboard && git pull origin main && sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && sudo nginx -t && sudo systemctl reload nginx && pm2 restart all && echo '' && echo '=== DEPLOY SUKSES ===' && pm2 list"

if errorlevel 1 (
    echo.
    echo ========================================
    echo    ERROR: Deploy gagal!
    echo    Cek koneksi internet atau password
    echo ========================================
) else (
    echo.
    echo ========================================
    echo    DEPLOY SELESAI SUKSES!
    echo ========================================
)

echo.
echo Tekan tombol apa saja untuk menutup...
pause >nul
