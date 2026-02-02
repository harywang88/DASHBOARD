# Harywang One-Click Deploy
# Double-click file ini untuk deploy

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HARYWANG DASHBOARD - DEPLOY TO VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git
Write-Host "[1/3] Git Commit & Push..." -ForegroundColor Yellow
git add -A
git commit -m "auto: Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main

Write-Host ""
Write-Host "[2/3] Connecting ke VPS..." -ForegroundColor Yellow
Write-Host ""

# Simpan password (untuk kemudahan, bisa dihapus nanti)
$VPS_PASS = "sasa1212"
$VPS_HOST = "root@144.217.13.125"

# Buat script untuk dijalankan di VPS
$REMOTE_CMD = @"
cd /var/www/harywang-dashboard
git pull origin main
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online
sudo nginx -t && sudo systemctl reload nginx
pm2 restart all
echo ''
echo '=== DEPLOY SUKSES ==='
pm2 list
"@

# Coba pakai plink (PuTTY) jika ada
$plink = Get-Command plink -ErrorAction SilentlyContinue

if ($plink) {
    Write-Host "Menggunakan PuTTY plink..." -ForegroundColor Green
    echo $VPS_PASS | plink -batch -pw $VPS_PASS $VPS_HOST $REMOTE_CMD
} else {
    # Fallback: gunakan ssh dengan expect-like behavior
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host " PuTTY tidak ditemukan!" -ForegroundColor Red
    Write-Host " Install PuTTY dulu untuk auto-password" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ATAU jalankan manual:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Buka PowerShell" -ForegroundColor White
    Write-Host "2. Ketik: ssh root@144.217.13.125" -ForegroundColor White
    Write-Host "3. Masukkan password: $VPS_PASS" -ForegroundColor White
    Write-Host "4. Jalankan perintah berikut:" -ForegroundColor White
    Write-Host ""
    Write-Host $REMOTE_CMD -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tekan ENTER untuk menutup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host
