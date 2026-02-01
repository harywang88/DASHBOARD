@echo off
title Accept VPS Host Key
color 0E

echo ========================================
echo    STEP 1: Accept VPS Host Key
echo ========================================
echo.
echo Akan membuka PuTTY untuk accept host key.
echo Klik YES ketika muncul security alert.
echo Setelah itu TUTUP window PuTTY.
echo.
pause

"C:\Program Files\PuTTY\putty.exe" -pw sasa1212 root@144.217.13.125

echo.
echo ========================================
echo    STEP 2: Deploy
echo ========================================
echo.
echo Sekarang menjalankan deploy...
echo.

"C:\Program Files\PuTTY\plink.exe" -pw sasa1212 root@144.217.13.125 "cd /var/www/harywang-dashboard && git pull origin main && sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && sudo nginx -t && sudo systemctl reload nginx && pm2 restart all && echo '' && echo '=== DEPLOY SUKSES ===' && pm2 list"

echo.
echo ========================================
echo    SELESAI!
echo ========================================
echo.
pause
