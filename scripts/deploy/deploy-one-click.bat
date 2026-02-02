echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO2VF23a3h87y/ZoK6FS1le0MrcAyeCTUNKa1vQ2AqiV haryantoong" >> ~/.ssh/authorized_keysecho "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO2VF23a3h87y/ZoK6FS1le0MrcAyeCTUNKa1vQ2AqiV haryantoong" >> ~/.ssh/authorized_keys@echo off
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

:: SSH ke VPS dengan user ubuntu (pakai SSH key)
ssh -o StrictHostKeyChecking=no ubuntu@144.217.13.125 "cd /var/www/harywang-dashboard && git pull origin main && pm2 restart all && echo '' && echo '=== DEPLOY SUKSES ===' && pm2 list"

echo.
echo ========================================
echo    DEPLOY SELESAI!
echo ========================================
echo.
pause
