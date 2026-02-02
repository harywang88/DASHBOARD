#!/bin/bash
# ============================================
# SETUP CLOUDFLARE TUNNEL
# Public access via domain harywang.online
# ============================================

set -e

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

TUNNEL_NAME="harywang-local"
DOMAIN="harywang.online"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   SETUP CLOUDFLARE TUNNEL${NC}"
echo -e "${GREEN}============================================${NC}"

# === 1. LOGIN CLOUDFLARE ===
echo -e "\n${YELLOW}[1/5] Login ke Cloudflare...${NC}"
echo -e "${CYAN}Browser akan terbuka untuk autentikasi${NC}"
cloudflared tunnel login

# === 2. CREATE TUNNEL ===
echo -e "\n${YELLOW}[2/5] Membuat tunnel: $TUNNEL_NAME${NC}"
cloudflared tunnel create $TUNNEL_NAME 2>/dev/null || echo "Tunnel sudah ada"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo -e "${GREEN}✅ Tunnel ID: $TUNNEL_ID${NC}"

# === 3. CREATE CONFIG ===
echo -e "\n${YELLOW}[3/5] Membuat config file...${NC}"

mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

ingress:
  # Main dashboard
  - hostname: $DOMAIN
    service: http://localhost:80
  
  # API routes
  - hostname: api.$DOMAIN
    service: http://localhost:80
  
  # Convert service (optional subdomain)
  - hostname: convert.$DOMAIN
    service: http://localhost:3001
  
  # PDF service (optional subdomain)
  - hostname: pdf.$DOMAIN
    service: http://localhost:3002
  
  # Cloud service (optional subdomain)  
  - hostname: cloud.$DOMAIN
    service: http://localhost:3003
  
  # Catch-all
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Config created: ~/.cloudflared/config.yml${NC}"

# === 4. SETUP DNS ===
echo -e "\n${YELLOW}[4/5] Setup DNS routes...${NC}"
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN 2>/dev/null || echo "DNS route sudah ada"
# cloudflared tunnel route dns $TUNNEL_NAME api.$DOMAIN 2>/dev/null || true
# cloudflared tunnel route dns $TUNNEL_NAME convert.$DOMAIN 2>/dev/null || true
# cloudflared tunnel route dns $TUNNEL_NAME pdf.$DOMAIN 2>/dev/null || true
# cloudflared tunnel route dns $TUNNEL_NAME cloud.$DOMAIN 2>/dev/null || true
echo -e "${GREEN}✅ DNS routes configured${NC}"

# === 5. INSTALL AS SERVICE ===
echo -e "\n${YELLOW}[5/5] Install sebagai systemd service...${NC}"
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# === VERIFY ===
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}   CLOUDFLARE TUNNEL READY!${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "\n${CYAN}Status:${NC}"
sudo systemctl status cloudflared --no-pager | head -5

echo -e "\n${CYAN}Your domain is now accessible at:${NC}"
echo -e "  ${YELLOW}https://$DOMAIN${NC}"

echo -e "\n${CYAN}Commands:${NC}"
echo -e "  Start:   ${YELLOW}sudo systemctl start cloudflared${NC}"
echo -e "  Stop:    ${YELLOW}sudo systemctl stop cloudflared${NC}"
echo -e "  Status:  ${YELLOW}sudo systemctl status cloudflared${NC}"
echo -e "  Logs:    ${YELLOW}sudo journalctl -u cloudflared -f${NC}"

echo -e "\n${CYAN}Manual run (untuk debug):${NC}"
echo -e "  ${YELLOW}cloudflared tunnel run $TUNNEL_NAME${NC}"
