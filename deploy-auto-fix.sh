#!/bin/bash
# ============================================
# Auto Deploy & Fix - Harywang Dashboard
# ============================================

set -e

echo ""
echo "========================================"
echo "   HARYWANG AUTO-DEPLOY WITH FIXES"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

VPS_HOST="144.217.13.125"
VPS_USER="root"
VPS_PATH="/var/www/harywang-dashboard"

echo -e "${YELLOW}[1/5] Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}  ✗ Uncommitted changes found!${NC}"
    git status --short
    echo ""
    read -p "Commit semua perubahan? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}  → Committing changes...${NC}"
        git add -A
        git commit -m "fix: Panel login issues + nginx routes + cloud service"
        git push origin main
        echo -e "${GREEN}  ✓ Changes committed and pushed!${NC}"
    else
        echo -e "${RED}  ✗ Deploy cancelled.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}  ✓ No uncommitted changes${NC}"
fi

echo ""
echo -e "${YELLOW}[2/5] Pulling latest code on VPS...${NC}"
ssh -t "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && git pull origin main"

echo ""
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
ssh -t "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/harywang-dashboard
echo "  → Root dependencies..."
npm install --production --silent
echo "  → Convert service..."
cd services/convert && npm install --production --silent && cd ../..
echo "  → PDF service..."
cd services/pdf/backend && npm install --production --silent && cd ../../..
echo "  → Cloud service (CRITICAL FIX)..."
cd services/cloud && npm install --production --silent && cd ../..
echo "  ✓ All dependencies installed!"
ENDSSH

echo ""
echo -e "${YELLOW}[4/5] Updating Nginx configuration...${NC}"
ssh -t "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/harywang-dashboard
echo "  → Backing up old config..."
sudo cp /etc/nginx/sites-available/harywang.online /etc/nginx/sites-available/harywang.online.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo "  → Copying new config..."
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online
echo "  → Testing nginx config..."
if sudo nginx -t; then
    echo "  → Reloading nginx..."
    sudo systemctl reload nginx
    echo "  ✓ Nginx updated successfully!"
else
    echo "  ✗ Nginx config test failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${YELLOW}[5/5] Restarting PM2 services...${NC}"
ssh -t "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /var/www/harywang-dashboard
echo "  → Restarting all services..."
pm2 restart ecosystem.config.js
echo "  → Waiting for services to start..."
sleep 3
echo ""
echo "=== PM2 Status ==="
pm2 list
echo ""
echo "=== Recent Logs (Cloud Service) ==="
pm2 logs harywang-cloud --lines 10 --nostream
ENDSSH

echo ""
echo -e "${GREEN}========================================"
echo "   DEPLOY BERHASIL! ✓"
echo "========================================${NC}"
echo ""
echo -e "${CYAN}📱 Test URL:${NC}"
echo "  • Dashboard    : https://harywang.online"
echo "  • Convert      : https://harywang.online/convert"
echo "  • PDF-SaaS     : https://harywang.online/pdf"
echo "  • Cloud        : https://harywang.online/cloud"
echo -e "  • ${GREEN}Master Panel : https://harywang.online/adminarea/master-login${NC}"
echo ""
echo -e "${YELLOW}🔐 Login Info:${NC}"
echo "  Username: harywang"
echo "  Password: Harywang2026!"
echo ""
echo -e "${CYAN}📊 Monitor logs:${NC}"
echo "  ssh $VPS_USER@$VPS_HOST 'pm2 logs harywang-cloud'"
echo ""
