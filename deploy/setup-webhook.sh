#!/bin/bash
# ============================================
# Setup Auto-Deploy Webhook untuk VPS
# Jalankan sekali di VPS: bash deploy/setup-webhook.sh
# ============================================

set -e

PROJECT_DIR="/var/www/harywang-dashboard"
WEBHOOK_PORT=9000

# Generate random secret
WEBHOOK_SECRET=$(openssl rand -hex 20)

echo "========================================"
echo "  Setup Auto-Deploy Webhook"
echo "========================================"
echo ""

# Buka port 9000 di firewall
echo "[1/3] Membuka port $WEBHOOK_PORT di firewall..."
sudo ufw allow $WEBHOOK_PORT/tcp 2>/dev/null || true
echo "  Port $WEBHOOK_PORT sudah dibuka."
echo ""

# Set environment variable untuk PM2
echo "[2/3] Menyimpan konfigurasi..."
echo ""
echo "  WEBHOOK_SECRET: $WEBHOOK_SECRET"
echo ""
echo "  SIMPAN SECRET INI! Kamu akan butuh saat setup webhook di GitHub."
echo ""

# Start webhook dengan PM2
echo "[3/3] Memulai webhook server via PM2..."
cd "$PROJECT_DIR"

WEBHOOK_SECRET=$WEBHOOK_SECRET WEBHOOK_PORT=$WEBHOOK_PORT PROJECT_DIR=$PROJECT_DIR \
  pm2 start ecosystem.config.js --only webhook

pm2 save

echo ""
echo "========================================"
echo "  SETUP SELESAI!"
echo "========================================"
echo ""
echo "  Webhook server berjalan di port $WEBHOOK_PORT"
echo ""
echo "  Langkah selanjutnya di GitHub:"
echo "  1. Buka: https://github.com/harywang88/DASHBOARD/settings/hooks/new"
echo "  2. Payload URL : http://harywang.online:$WEBHOOK_PORT/webhook"
echo "  3. Content type: application/json"
echo "  4. Secret      : $WEBHOOK_SECRET"
echo "  5. Events      : Just the push event"
echo "  6. Klik 'Add webhook'"
echo ""
echo "  Cek status: pm2 status"
echo "  Cek log   : pm2 logs webhook"
echo "========================================"
