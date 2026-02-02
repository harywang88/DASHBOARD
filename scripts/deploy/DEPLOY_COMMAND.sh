#!/bin/bash
# One-liner deployment command untuk paste di terminal SSH

cd /var/www/harywang-dashboard && \
echo "==> Pulling latest code..." && \
git pull origin main && \
echo "==> Installing root dependencies..." && \
npm install --production && \
echo "==> Installing Cloud service dependencies..." && \
cd services/cloud && npm install --production && cd ../.. && \
echo "==> Updating nginx configuration..." && \
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && \
echo "==> Testing nginx config..." && \
sudo nginx -t && \
echo "==> Reloading nginx..." && \
sudo systemctl reload nginx && \
echo "==> Restarting PM2 services..." && \
pm2 restart ecosystem.config.js && \
echo "==> Checking PM2 status..." && \
pm2 list && \
echo "" && \
echo "✅ DEPLOYMENT COMPLETE!" && \
echo "🌐 Test URL: https://harywang.online/adminarea/master-login"
