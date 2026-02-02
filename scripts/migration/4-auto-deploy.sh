#!/bin/bash
# ============================================
# AUTO-DEPLOY SCRIPT
# Auto restart app saat file berubah (git pull)
# ============================================

set -e

# === KONFIGURASI ===
APP_PATH="/var/www/harywang-dashboard"
BRANCH="main"
CHECK_INTERVAL=60  # Cek setiap 60 detik

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   AUTO-DEPLOY - Harywang Dashboard${NC}"
echo -e "${GREEN}============================================${NC}"

cd $APP_PATH

# Fungsi untuk deploy
deploy() {
    echo -e "\n${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Deploying...${NC}"
    
    # Pull latest code
    git fetch origin $BRANCH
    git reset --hard origin/$BRANCH
    
    # Install dependencies
    npm install --production --silent
    
    # Install sub-services
    for service in services/cloud services/convert services/pdf/backend; do
        if [ -d "$service" ] && [ -f "$service/package.json" ]; then
            cd $APP_PATH/$service
            npm install --production --silent
        fi
    done
    cd $APP_PATH
    
    # Restart PM2
    pm2 restart ecosystem.config.js
    
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Deploy complete!${NC}"
    pm2 list
}

# === MODE 1: WATCH MODE (dengan inotifywait) ===
watch_mode() {
    echo -e "${CYAN}Mode: File Watch (inotifywait)${NC}"
    
    # Install inotify-tools jika belum ada
    if ! command -v inotifywait &> /dev/null; then
        sudo apt install -y inotify-tools
    fi
    
    echo -e "${YELLOW}👀 Watching for changes in $APP_PATH...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
    
    while true; do
        inotifywait -r -e modify,create,delete --exclude 'node_modules|\.git|logs' $APP_PATH 2>/dev/null
        echo -e "${YELLOW}📝 File changed! Restarting...${NC}"
        pm2 restart ecosystem.config.js
        sleep 2
    done
}

# === MODE 2: GIT POLL MODE ===
git_poll_mode() {
    echo -e "${CYAN}Mode: Git Poll (cek setiap ${CHECK_INTERVAL}s)${NC}"
    echo -e "${YELLOW}👀 Watching for git changes...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
    
    CURRENT_HASH=$(git rev-parse HEAD)
    
    while true; do
        git fetch origin $BRANCH --quiet
        REMOTE_HASH=$(git rev-parse origin/$BRANCH)
        
        if [ "$CURRENT_HASH" != "$REMOTE_HASH" ]; then
            echo -e "${YELLOW}🆕 New commit detected!${NC}"
            deploy
            CURRENT_HASH=$REMOTE_HASH
        else
            echo -e "${CYAN}[$(date '+%H:%M:%S')] No changes${NC}"
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# === MODE 3: PM2 WATCH (Built-in) ===
pm2_watch_mode() {
    echo -e "${CYAN}Mode: PM2 Watch (built-in)${NC}"
    
    # Stop existing
    pm2 stop ecosystem.config.js 2>/dev/null || true
    pm2 delete ecosystem.config.js 2>/dev/null || true
    
    # Start dengan watch mode
    pm2 start ecosystem.config.js --watch --ignore-watch="node_modules logs uploads .git"
    pm2 save
    
    echo -e "${GREEN}✅ PM2 Watch mode aktif!${NC}"
    echo -e "${YELLOW}File changes akan otomatis trigger restart${NC}"
    pm2 list
}

# === MENU ===
echo -e "\nPilih mode auto-deploy:"
echo -e "1. ${CYAN}PM2 Watch${NC} - Restart saat file lokal berubah (recommended)"
echo -e "2. ${CYAN}Git Poll${NC}  - Cek git setiap ${CHECK_INTERVAL}s, deploy jika ada update"
echo -e "3. ${CYAN}File Watch${NC} - Watch dengan inotifywait"
echo -e "4. ${CYAN}Deploy Now${NC} - Deploy sekali saja"
echo ""
read -p "Pilih (1-4): " choice

case $choice in
    1) pm2_watch_mode ;;
    2) git_poll_mode ;;
    3) watch_mode ;;
    4) deploy ;;
    *) echo -e "${RED}Pilihan tidak valid${NC}"; exit 1 ;;
esac
