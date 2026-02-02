#!/bin/bash
# ============================================
# SETUP SERVER LOKAL - Ubuntu 22.04
# Jalankan di server lokal dengan sudo
# ============================================

set -e

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   SETUP SERVER LOKAL - Ubuntu 22.04${NC}"
echo -e "${GREEN}============================================${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Script ini harus dijalankan dengan sudo!${NC}"
    exit 1
fi

# === 1. UPDATE SYSTEM ===
echo -e "\n${YELLOW}[1/7] Update system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential software-properties-common
echo -e "${GREEN}✅ System updated${NC}"

# === 2. INSTALL NODE.JS 18 ===
echo -e "\n${YELLOW}[2/7] Install Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"
echo -e "${GREEN}✅ npm $(npm -v) installed${NC}"

# === 3. INSTALL POSTGRESQL 15 ===
echo -e "\n${YELLOW}[3/7] Install PostgreSQL 15...${NC}"
if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update
    apt install -y postgresql-15 postgresql-contrib-15
    systemctl enable postgresql
    systemctl start postgresql
fi
echo -e "${GREEN}✅ PostgreSQL 15 installed${NC}"

# === 4. INSTALL PM2 ===
echo -e "\n${YELLOW}[4/7] Install PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
fi
echo -e "${GREEN}✅ PM2 $(pm2 -v) installed${NC}"

# === 5. INSTALL TAILSCALE ===
echo -e "\n${YELLOW}[5/7] Install Tailscale...${NC}"
if ! command -v tailscale &> /dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
fi
echo -e "${GREEN}✅ Tailscale installed${NC}"
echo -e "${CYAN}   Jalankan: sudo tailscale up${NC}"

# === 6. INSTALL CLOUDFLARE TUNNEL ===
echo -e "\n${YELLOW}[6/7] Install Cloudflare Tunnel (cloudflared)...${NC}"
if ! command -v cloudflared &> /dev/null; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
fi
echo -e "${GREEN}✅ Cloudflared $(cloudflared --version | head -1) installed${NC}"

# === 7. INSTALL NGINX (OPTIONAL) ===
echo -e "\n${YELLOW}[7/7] Install Nginx (reverse proxy)...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi
echo -e "${GREEN}✅ Nginx installed${NC}"

# === SETUP FIREWALL ===
echo -e "\n${YELLOW}🔒 Setup UFW Firewall...${NC}"
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001:3010/tcp  # Untuk development ports
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# === SUMMARY ===
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}   SETUP SELESAI!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\n${CYAN}Langkah selanjutnya:${NC}"
echo -e "1. Setup Tailscale:    ${YELLOW}sudo tailscale up${NC}"
echo -e "2. Setup Cloudflare:   ${YELLOW}cloudflared tunnel login${NC}"
echo -e "3. Restore backup:     ${YELLOW}./3-restore-backup.sh${NC}"
echo -e "4. Setup auto-deploy:  ${YELLOW}./4-auto-deploy.sh${NC}"

# Info PostgreSQL
echo -e "\n${CYAN}PostgreSQL Info:${NC}"
echo -e "- Default user: postgres"
echo -e "- Akses: ${YELLOW}sudo -u postgres psql${NC}"
echo -e "- Buat DB: ${YELLOW}CREATE DATABASE harywang_db;${NC}"
