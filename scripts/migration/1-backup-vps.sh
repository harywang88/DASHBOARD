#!/bin/bash
# ============================================
# BACKUP VPS SCRIPT - Harywang Dashboard
# Jalankan dari komputer lokal (bukan VPS)
# ============================================

set -e

# === KONFIGURASI ===
VPS_HOST="root@144.217.13.125"
VPS_APP_PATH="/var/www/harywang-dashboard"
LOCAL_BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
PG_USER="postgres"
PG_DB="harywang_db"

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   BACKUP VPS - Harywang Dashboard${NC}"
echo -e "${GREEN}============================================${NC}"

# Buat folder backup lokal
mkdir -p "$LOCAL_BACKUP_DIR"
echo -e "${YELLOW}📁 Folder backup: $LOCAL_BACKUP_DIR${NC}"

# 1. Backup Aplikasi Node.js
echo -e "\n${YELLOW}[1/5] Backup aplikasi Node.js...${NC}"
ssh $VPS_HOST "cd $VPS_APP_PATH && tar --exclude='node_modules' --exclude='.git' -czf /tmp/app-backup.tar.gz ."
scp $VPS_HOST:/tmp/app-backup.tar.gz "$LOCAL_BACKUP_DIR/"
echo -e "${GREEN}✅ Aplikasi berhasil di-backup${NC}"

# 2. Backup Database PostgreSQL
echo -e "\n${YELLOW}[2/5] Backup database PostgreSQL...${NC}"
ssh $VPS_HOST "sudo -u postgres pg_dump -F c -b -v -f /tmp/db-backup.dump $PG_DB 2>/dev/null || echo 'Skip jika tidak ada PostgreSQL'"
scp $VPS_HOST:/tmp/db-backup.dump "$LOCAL_BACKUP_DIR/" 2>/dev/null || echo "Database tidak ada atau skip"
echo -e "${GREEN}✅ Database berhasil di-backup${NC}"

# 3. Backup File Uploads
echo -e "\n${YELLOW}[3/5] Backup file uploads...${NC}"
ssh $VPS_HOST "cd $VPS_APP_PATH && tar -czf /tmp/uploads-backup.tar.gz services/cloud/uploads services/cloud/storage services/convert/uploads 2>/dev/null || tar -czf /tmp/uploads-backup.tar.gz services/cloud/storage 2>/dev/null || echo 'Tidak ada folder uploads'"
scp $VPS_HOST:/tmp/uploads-backup.tar.gz "$LOCAL_BACKUP_DIR/" 2>/dev/null || echo "Skip uploads"
echo -e "${GREEN}✅ Uploads berhasil di-backup${NC}"

# 4. Backup Environment Variables
echo -e "\n${YELLOW}[4/5] Backup environment variables...${NC}"
ssh $VPS_HOST "cat $VPS_APP_PATH/.env" > "$LOCAL_BACKUP_DIR/env-backup.env" 2>/dev/null || echo "Tidak ada .env"
echo -e "${GREEN}✅ Environment variables berhasil di-backup${NC}"

# 5. Backup PM2 Ecosystem Config
echo -e "\n${YELLOW}[5/5] Backup PM2 config...${NC}"
ssh $VPS_HOST "cat $VPS_APP_PATH/ecosystem.config.js" > "$LOCAL_BACKUP_DIR/ecosystem.config.js" 2>/dev/null || echo "Tidak ada ecosystem.config.js"
echo -e "${GREEN}✅ PM2 config berhasil di-backup${NC}"

# Cleanup temp files di VPS
echo -e "\n${YELLOW}🧹 Cleanup temporary files di VPS...${NC}"
ssh $VPS_HOST "rm -f /tmp/app-backup.tar.gz /tmp/db-backup.dump /tmp/uploads-backup.tar.gz"

# Summary
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}   BACKUP SELESAI!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "📁 Lokasi backup: ${YELLOW}$LOCAL_BACKUP_DIR${NC}"
echo -e "\nIsi backup:"
ls -lh "$LOCAL_BACKUP_DIR"
echo -e "\n${GREEN}Selanjutnya jalankan: ./2-setup-local-server.sh${NC}"
