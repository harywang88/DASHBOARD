# ============================================
# Auto Deploy & Fix - Harywang Dashboard
# Jalankan: .\deploy-auto-fix.ps1
# ============================================

param(
    [string]$VpsHost = "144.217.13.125",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/var/www/harywang-dashboard"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HARYWANG AUTO-DEPLOY WITH FIXES    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Git Status
Write-Host "[1/5] Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ✗ Uncommitted changes found!" -ForegroundColor Red
    git status --short
    Write-Host ""
    $response = Read-Host "Commit semua perubahan? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "  → Committing changes..." -ForegroundColor Cyan
        git add -A
        git commit -m "fix: Panel login issues + nginx routes + cloud service"
        git push origin main
        Write-Host "  ✓ Changes committed and pushed!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Deploy cancelled." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✓ No uncommitted changes" -ForegroundColor Green
}

# Step 2: Pull latest code
Write-Host ""
Write-Host "[2/5] Pulling latest code on VPS..." -ForegroundColor Yellow
$cmd2 = "cd $VpsPath && git pull origin main"
ssh -t "$VpsUser@$VpsHost" $cmd2

# Step 3: Install dependencies
Write-Host ""
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
$cmd3 = @"
cd $VpsPath && \
echo '  → Root dependencies...' && \
npm install --production --silent && \
echo '  → Convert service...' && \
cd services/convert && npm install --production --silent && cd ../.. && \
echo '  → PDF service...' && \
cd services/pdf/backend && npm install --production --silent && cd ../../.. && \
echo '  → Cloud service (CRITICAL FIX)...' && \
cd services/cloud && npm install --production --silent && cd ../.. && \
echo '  ✓ All dependencies installed!'
"@
ssh -t "$VpsUser@$VpsHost" $cmd3

# Step 4: Update Nginx
Write-Host ""
Write-Host "[4/5] Updating Nginx configuration..." -ForegroundColor Yellow
$cmd4 = @"
cd $VpsPath && \
echo '  → Backing up old config...' && \
sudo cp /etc/nginx/sites-available/harywang.online /etc/nginx/sites-available/harywang.online.backup-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || true && \
echo '  → Copying new config...' && \
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online && \
echo '  → Testing nginx config...' && \
if sudo nginx -t; then \
    echo '  → Reloading nginx...' && \
    sudo systemctl reload nginx && \
    echo '  ✓ Nginx updated successfully!'; \
else \
    echo '  ✗ Nginx config test failed!' && exit 1; \
fi
"@
ssh -t "$VpsUser@$VpsHost" $cmd4

# Step 5: Restart PM2
Write-Host ""
Write-Host "[5/5] Restarting PM2 services..." -ForegroundColor Yellow
$cmd5 = @"
cd $VpsPath && \
echo '  → Restarting all services...' && \
pm2 restart ecosystem.config.js && \
echo '  → Waiting for services to start...' && \
sleep 3 && \
echo '' && \
echo '=== PM2 Status ===' && \
pm2 list && \
echo '' && \
echo '=== Recent Logs (Cloud Service) ===' && \
pm2 logs harywang-cloud --lines 10 --nostream
"@
ssh -t "$VpsUser@$VpsHost" $cmd5

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   DEPLOY BERHASIL! ✓                 " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Test URL:" -ForegroundColor Cyan
Write-Host "  • Dashboard    : https://harywang.online" -ForegroundColor White
Write-Host "  • Convert      : https://harywang.online/convert" -ForegroundColor White
Write-Host "  • PDF-SaaS     : https://harywang.online/pdf" -ForegroundColor White
Write-Host "  • Cloud        : https://harywang.online/cloud" -ForegroundColor White
Write-Host "  • Master Panel : https://harywang.online/adminarea/master-login" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Login Info:" -ForegroundColor Yellow
Write-Host "  Username: harywang" -ForegroundColor White
Write-Host "  Password: Harywang2026!" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor logs:" -ForegroundColor Cyan
Write-Host "  ssh $VpsUser@$VpsHost 'pm2 logs harywang-cloud'" -ForegroundColor White
Write-Host ""

# Prompt user to continue
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
