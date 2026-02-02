# Auto Deploy to VPS with Password
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTO DEPLOY TO VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vpsHost = "144.217.13.125"
$vpsUser = "ubuntu"
$vpsPass = "sasa1212"

# Command to execute on VPS
$deployCmd = @"
cd /var/www/harywang-dashboard && \
git pull origin main && \
npm install --production && \
cd services/cloud && npm install --production && cd ../.. && \
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && \
sudo nginx -t && sudo systemctl reload nginx && \
pm2 restart ecosystem.config.js && \
pm2 list
"@

Write-Host "Connecting to: $vpsUser@$vpsHost" -ForegroundColor Yellow
Write-Host "Executing deployment..." -ForegroundColor Yellow
Write-Host ""

# Try using plink if available (from PuTTY)
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "Using plink for deployment..." -ForegroundColor Green
    echo y | plink -ssh -pw $vpsPass $vpsUser@$vpsHost $deployCmd
} else {
    Write-Host "Plink not found. Manual deployment required." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run this command manually:" -ForegroundColor Yellow
    Write-Host "ssh $vpsUser@$vpsHost" -ForegroundColor White
    Write-Host "Password: $vpsPass" -ForegroundColor White
    Write-Host ""
    Write-Host "Then paste this command:" -ForegroundColor Yellow
    Write-Host $deployCmd -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to open SSH connection"
    ssh $vpsUser@$vpsHost
}
