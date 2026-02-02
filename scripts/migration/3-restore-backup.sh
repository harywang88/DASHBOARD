#!/bin/bash
# ============================================
# RESTORE BACKUP - Server Lokal
# Jalankan setelah setup-local-server.sh
# ============================================

set -e

# === KONFIGURASI ===
BACKUP_DIR="${1:-./backups/latest}"  # Folder backup, bisa di-override via argument
APP_PATH="/var/www/harywang-dashboard"
PG_USER="postgres"
PG_DB="harywang_db"

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   RESTORE BACKUP - Server Lokal${NC}"
echo -e "${GREEN}============================================${NC}"

# Check backup folder
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Folder backup tidak ditemukan: $BACKUP_DIR${NC}"
    echo -e "Usage: ./3-restore-backup.sh /path/to/backup/folder"
    exit 1
fi

echo -e "${YELLOW}📁 Restore dari: $BACKUP_DIR${NC}"

# === 1. RESTORE APLIKASI ===
echo -e "\n${YELLOW}[1/4] Restore aplikasi Node.js...${NC}"
sudo mkdir -p $APP_PATH
sudo chown -R $USER:$USER $APP_PATH

if [ -f "$BACKUP_DIR/app-backup.tar.gz" ]; then
    tar -xzf "$BACKUP_DIR/app-backup.tar.gz" -C $APP_PATH
    echo -e "${GREEN}✅ Aplikasi restored ke $APP_PATH${NC}"
else
    echo -e "${RED}⚠️ app-backup.tar.gz tidak ditemukan, skip${NC}"
fi

# === 2. INSTALL DEPENDENCIES ===
echo -e "\n${YELLOW}[2/4] Install npm dependencies...${NC}"
cd $APP_PATH
npm install --production

# Install dependencies untuk sub-services
for service in services/cloud services/convert services/pdf/backend; do
    if [ -d "$service" ] && [ -f "$service/package.json" ]; then
        echo -e "${YELLOW}   Installing: $service${NC}"
        cd $APP_PATH/$service
        npm install --production
    fi
done
cd $APP_PATH
echo -e "${GREEN}✅ Dependencies installed${NC}"

# === 3. RESTORE DATABASE ===
echo -e "\n${YELLOW}[3/4] Restore database PostgreSQL...${NC}"
if [ -f "$BACKUP_DIR/db-backup.dump" ]; then
    # Buat database jika belum ada
    sudo -u postgres psql -c "CREATE DATABASE $PG_DB;" 2>/dev/null || echo "Database sudah ada"
    
    # Restore
    sudo -u postgres pg_restore -d $PG_DB -c "$BACKUP_DIR/db-backup.dump" 2>/dev/null || echo "Restore dengan warning"
    echo -e "${GREEN}✅ Database restored${NC}"
else
    echo -e "${YELLOW}⚠️ db-backup.dump tidak ditemukan, skip${NC}"
fi

# === 4. RESTORE UPLOADS ===
echo -e "\n${YELLOW}[4/4] Restore file uploads...${NC}"
if [ -f "$BACKUP_DIR/uploads-backup.tar.gz" ]; then
    tar -xzf "$BACKUP_DIR/uploads-backup.tar.gz" -C $APP_PATH
    echo -e "${GREEN}✅ Uploads restored${NC}"
else
    echo -e "${YELLOW}⚠️ uploads-backup.tar.gz tidak ditemukan, skip${NC}"
fi

# === 5. RESTORE .ENV ===
echo -e "\n${YELLOW}[5/5] Restore environment variables...${NC}"
if [ -f "$BACKUP_DIR/env-backup.env" ]; then
    cp "$BACKUP_DIR/env-backup.env" "$APP_PATH/.env"
    echo -e "${GREEN}✅ .env restored${NC}"
    echo -e "${YELLOW}⚠️ PENTING: Edit .env untuk sesuaikan dengan server lokal!${NC}"
else
    echo -e "${YELLOW}⚠️ env-backup.env tidak ditemukan${NC}"
fi

# === START APP ===
echo -e "\n${YELLOW}🚀 Starting aplikasi dengan PM2...${NC}"
cd $APP_PATH
pm2 start ecosystem.config.js
pm2 save
pm2 list

# === SUMMARY ===
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}   RESTORE SELESAI!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\n${YELLOW}Checklist:${NC}"
echo -e "[ ] Edit .env sesuai server lokal"
echo -e "[ ] Test akses: http://localhost"
echo -e "[ ] Setup Cloudflare Tunnel untuk public access"
echo -e "\n${YELLOW}Commands:${NC}"
echo -e "- Lihat logs: ${YELLOW}pm2 logs${NC}"
echo -e "- Restart:    ${YELLOW}pm2 restart all${NC}"
echo -e "- Status:     ${YELLOW}pm2 status${NC}"
