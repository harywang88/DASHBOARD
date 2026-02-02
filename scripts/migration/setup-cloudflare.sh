#!/bin/bash
# ============================================
# SETUP CLOUDFLARE TUNNEL - LENGKAP
# Auto-setup tunnel untuk harywang.online
# ============================================

set -e

TUNNEL_NAME="harywang-local"
DOMAIN="harywang.online"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== SETUP CLOUDFLARE TUNNEL ===${NC}"

# Step 1: Login
echo -e "\n${CYAN}[1/4] Login Cloudflare...${NC}"
cloudflared tunnel login

# Step 2: Create tunnel
echo -e "\n${CYAN}[2/4] Create Tunnel...${NC}"
cloudflared tunnel create $TUNNEL_NAME 2>/dev/null || echo "Tunnel sudah ada"
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo -e "${GREEN}Tunnel ID: $TUNNEL_ID${NC}"

# Step 3: Create config
echo -e "\n${CYAN}[3/4] Create Config...${NC}"
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:80
  - hostname: www.$DOMAIN
    service: http://localhost:80
  - service: http_status:404
EOF

echo -e "${GREEN}Config: ~/.cloudflared/config.yml${NC}"

# Step 4: Setup DNS & Service
echo -e "\n${CYAN}[4/4] Setup DNS & Service...${NC}"
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN 2>/dev/null || echo "DNS sudah ada"
cloudflared tunnel route dns $TUNNEL_NAME www.$DOMAIN 2>/dev/null || true

# Install as service
sudo cloudflared service install 2>/dev/null || echo "Service sudah ada"
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared

echo -e "\n${GREEN}=== CLOUDFLARE TUNNEL READY! ===${NC}"
echo -e "Domain: ${YELLOW}https://$DOMAIN${NC}"
echo -e "Status: ${YELLOW}sudo systemctl status cloudflared${NC}"
echo -e "Logs:   ${YELLOW}sudo journalctl -u cloudflared -f${NC}"
