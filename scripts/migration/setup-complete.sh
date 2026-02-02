#!/bin/bash
# ============================================
# SETUP LENGKAP SERVER LOKAL - ONE CLICK
# Harywang Dashboard Migration
# ============================================

set -e

# Warna
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Config
APP_PATH="/var/www/harywang-dashboard"
DOMAIN="harywang.online"
BACKUP_DIR="${1:-/tmp/backup}"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     HARYWANG DASHBOARD - SETUP SERVER LOKAL LENGKAP         ║"
echo "║                   Ubuntu 22.04                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Jalankan dengan sudo!${NC}"
    exit 1
fi

# ============================================
# STEP 1: UPDATE SYSTEM
# ============================================
echo -e "\n${CYAN}[1/10] Update System...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential software-properties-common unzip
echo -e "${GREEN}✅ System updated${NC}"

# ============================================
# STEP 2: INSTALL NODE.JS 18
# ============================================
echo -e "\n${CYAN}[2/10] Install Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# ============================================
# STEP 3: INSTALL POSTGRESQL 15
# ============================================
echo -e "\n${CYAN}[3/10] Install PostgreSQL 15...${NC}"
if ! command -v psql &> /dev/null; then
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt update
    apt install -y postgresql-15 postgresql-contrib-15
    systemctl enable postgresql
    systemctl start postgresql
fi
echo -e "${GREEN}✅ PostgreSQL installed${NC}"

# ============================================
# STEP 4: INSTALL PM2
# ============================================
echo -e "\n${CYAN}[4/10] Install PM2...${NC}"
npm install -g pm2
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER 2>/dev/null || true
echo -e "${GREEN}✅ PM2 $(pm2 -v)${NC}"

# ============================================
# STEP 5: INSTALL NGINX
# ============================================
echo -e "\n${CYAN}[5/10] Install Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✅ Nginx installed${NC}"

# ============================================
# STEP 6: INSTALL TAILSCALE
# ============================================
echo -e "\n${CYAN}[6/10] Install Tailscale...${NC}"
if ! command -v tailscale &> /dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
fi
echo -e "${GREEN}✅ Tailscale installed${NC}"
echo -e "${YELLOW}   Jalankan: sudo tailscale up${NC}"

# ============================================
# STEP 7: INSTALL CLOUDFLARE TUNNEL
# ============================================
echo -e "\n${CYAN}[7/10] Install Cloudflare Tunnel...${NC}"
if ! command -v cloudflared &> /dev/null; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared-linux-amd64.deb
    rm -f cloudflared-linux-amd64.deb
fi
echo -e "${GREEN}✅ Cloudflared installed${NC}"

# ============================================
# STEP 8: RESTORE APLIKASI
# ============================================
echo -e "\n${CYAN}[8/10] Restore Aplikasi...${NC}"
mkdir -p $APP_PATH
chown -R $SUDO_USER:$SUDO_USER $APP_PATH

if [ -f "$BACKUP_DIR/app-backup.tar.gz" ]; then
    tar -xzf "$BACKUP_DIR/app-backup.tar.gz" -C $APP_PATH
    echo -e "${GREEN}✅ Aplikasi restored ke $APP_PATH${NC}"
    
    # Install dependencies
    cd $APP_PATH
    npm install --production
    
    for service in services/cloud services/convert services/pdf/backend; do
        if [ -d "$service" ] && [ -f "$service/package.json" ]; then
            cd $APP_PATH/$service
            npm install --production
        fi
    done
    cd $APP_PATH
else
    echo -e "${YELLOW}⚠️ app-backup.tar.gz tidak ditemukan di $BACKUP_DIR${NC}"
fi

# Restore users.json
if [ -f "$BACKUP_DIR/users.json" ]; then
    cp "$BACKUP_DIR/users.json" $APP_PATH/
    echo -e "${GREEN}✅ users.json restored${NC}"
fi

# Restore master-credentials.json
if [ -f "$BACKUP_DIR/master-credentials.json" ]; then
    cp "$BACKUP_DIR/master-credentials.json" $APP_PATH/services/cloud/
    echo -e "${GREEN}✅ master-credentials.json restored${NC}"
fi

# ============================================
# STEP 9: SETUP NGINX
# ============================================
echo -e "\n${CYAN}[9/10] Setup Nginx...${NC}"

cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX'
server {
    listen 80;
    server_name harywang.online www.harywang.online;
    
    # Main dashboard
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Convert service
    location /convert {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
        proxy_read_timeout 300s;
    }
    
    # PDF service
    location /pdf {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }
    
    # Cloud service
    location /cloud {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 1G;
    }
    
    # Admin area
    location /adminarea {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api/adminarea {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# ============================================
# STEP 10: START APLIKASI
# ============================================
echo -e "\n${CYAN}[10/10] Start Aplikasi dengan PM2...${NC}"
cd $APP_PATH
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ Aplikasi running${NC}"

# ============================================
# SETUP FIREWALL
# ============================================
echo -e "\n${CYAN}Setup Firewall...${NC}"
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# ============================================
# SETUP AUTO-DEPLOY (Watch Mode)
# ============================================
echo -e "\n${CYAN}Setup Auto-Deploy Watch...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --watch --ignore-watch="node_modules logs uploads .git storage"
pm2 save
echo -e "${GREEN}✅ Auto-deploy (watch mode) aktif${NC}"

# ============================================
# CREATE MONITORING SCRIPT
# ============================================
cat > /usr/local/bin/harywang-monitor << 'MONITOR'
#!/bin/bash
while true; do
    clear
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     HARYWANG DASHBOARD - SERVER MONITOR                      ║"
    echo "║              $(date '+%Y-%m-%d %H:%M:%S')                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "=== PM2 STATUS ==="
    pm2 list
    echo ""
    echo "=== MEMORY ==="
    free -h | head -2
    echo ""
    echo "=== DISK ==="
    df -h / | tail -1
    echo ""
    echo "=== PORTS ==="
    for port in 80 8080 3001 3002 3003; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "Port $port: ● LISTENING"
        else
            echo "Port $port: ○ CLOSED"
        fi
    done
    echo ""
    echo "[Refresh in 5s | Ctrl+C to exit]"
    sleep 5
done
MONITOR
chmod +x /usr/local/bin/harywang-monitor
echo -e "${GREEN}✅ Monitoring script: harywang-monitor${NC}"

# ============================================
# SUMMARY
# ============================================
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SETUP SELESAI!                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Installed:${NC}"
echo "  ✅ Node.js $(node -v)"
echo "  ✅ npm $(npm -v)"
echo "  ✅ PostgreSQL 15"
echo "  ✅ PM2 $(pm2 -v)"
echo "  ✅ Nginx"
echo "  ✅ Tailscale"
echo "  ✅ Cloudflare Tunnel"

echo -e "\n${CYAN}Langkah Selanjutnya:${NC}"
echo -e "1. Setup Tailscale:     ${YELLOW}sudo tailscale up${NC}"
echo -e "2. Setup Cloudflare:    ${YELLOW}cloudflared tunnel login${NC}"
echo -e "3. Buat tunnel:         ${YELLOW}cloudflared tunnel create harywang${NC}"
echo -e "4. Monitor:             ${YELLOW}harywang-monitor${NC}"

echo -e "\n${CYAN}Akses:${NC}"
echo "  Local:     http://localhost"
echo "  Tailscale: http://$(tailscale ip -4 2>/dev/null || echo '<tailscale-ip>')"
echo "  Public:    https://$DOMAIN (setelah Cloudflare Tunnel)"

pm2 list
