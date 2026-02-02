@echo off
echo ========================================
echo QUICK DEPLOY TO VPS
echo ========================================
echo.
echo Username: ubuntu
echo Password: sasa1212
echo.
echo Paste command berikut setelah login SSH:
echo.
echo cd /var/www/harywang-dashboard ^&^& git pull origin main ^&^& npm install --production ^&^& cd services/cloud ^&^& npm install --production ^&^& cd ../.. ^&^& sudo cp nginx.conf /etc/nginx/sites-available/harywang.online ^&^& sudo nginx -t ^&^& sudo systemctl reload nginx ^&^& pm2 restart ecosystem.config.js ^&^& pm2 list
echo.
echo Opening SSH connection...
echo.
ssh ubuntu@144.217.13.125
