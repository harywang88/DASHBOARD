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

echo.
echo [2/3] Connecting ke VPS...
echo.
echo Masukkan password VPS ketika diminta:
echo.

:: SSH ke VPS dan jalankan deploy
ssh root@144.217.13.125 "cd /var/www/harywang-dashboard && git pull origin main && sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && sudo nginx -t && sudo systemctl reload nginx && pm2 restart all && echo '' && echo '=== DEPLOY SUKSES ===' && pm2 list"

echo.
echo ========================================
echo    DEPLOY SELESAI!
echo ========================================
echo.
pause
