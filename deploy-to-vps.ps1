# ============================================
# Deploy to VPS - Harywang Dashboard
# Jalankan: .\deploy-to-vps.ps1
# ============================================

param(
    [string]$VpsHost = "144.217.13.125",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/var/www/harywang-dashboard"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY HARYWANG DASHBOARD TO VPS    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  VPS  : $VpsUser@$VpsHost" -ForegroundColor White
Write-Host "  Path : $VpsPath" -ForegroundColor White
Write-Host ""

# Step 1: Git commit & push (jika ada perubahan)
Write-Host "[1/3] Checking local changes..." -ForegroundColor Yellow

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  Found uncommitted changes!" -ForegroundColor Red
    Write-Host "  Please commit first before deploying." -ForegroundColor Red
    Write-Host ""
    git status --short
    Write-Host ""
    exit 1
}

Write-Host "  No uncommitted changes. Ready to deploy!" -ForegroundColor Green
Write-Host ""

# Step 2: Connect to VPS and deploy
Write-Host "[2/3] Connecting to VPS and deploying..." -ForegroundColor Yellow
Write-Host ""

$deployCommand = @"
echo '=== Starting deployment ===' && \
cd $VpsPath && \
echo '=== Git Pull ===' && \
git pull origin main && \
echo '=== NPM Install (root) ===' && \
npm install --production && \
echo '=== NPM Install (convert) ===' && \
cd services/convert && npm install --production && cd ../.. && \
echo '=== NPM Install (pdf) ===' && \
cd services/pdf/backend && npm install --production && cd ../../.. && \
echo '=== NPM Install (cloud) ===' && \
cd services/cloud && npm install --production && cd ../.. && \
echo '=== PM2 Restart All ===' && \
pm2 restart ecosystem.config.js && \
echo '=== Status ===' && \
pm2 status && \
echo '=== Deploy Complete! ==='
"@

try {
    ssh -t "$VpsUser@$VpsHost" $deployCommand
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   DEPLOY BERHASIL!                    " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Test di:" -ForegroundColor White
    Write-Host "  - Dashboard    : https://harywang.online" -ForegroundColor Cyan
    Write-Host "  - Convert      : https://harywang.online/convert" -ForegroundColor Cyan
    Write-Host "  - PDF-SaaS     : https://harywang.online/pdf" -ForegroundColor Cyan
    Write-Host "  - Cloud        : https://harywang.online/cloud" -ForegroundColor Cyan
    Write-Host "  - Master Panel : https://harywang.online/cloud/adminarea/master-login" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   DEPLOY GAGAL!                       " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Tips:" -ForegroundColor Yellow
    Write-Host "  1. Pastikan SSH key sudah di-setup" -ForegroundColor White
    Write-Host "  2. Atau masukkan password VPS saat diminta" -ForegroundColor White
    Write-Host ""
    exit 1
}
