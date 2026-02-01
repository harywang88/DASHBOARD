$password = "sasa1212"
$commands = @"
cd /var/www/harywang-dashboard
git pull origin main
npm install --production
cd services/cloud && npm install --production && cd ../..
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online
sudo nginx -t && sudo systemctl reload nginx
pm2 restart ecosystem.config.js
pm2 list
"@

# Using plink if available, otherwise manual
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo $password | plink -batch -pw $password root@144.217.13.125 $commands
} else {
    Write-Host "Install PuTTY or run manual:" -ForegroundColor Yellow
    Write-Host $commands -ForegroundColor Cyan
}
