#!/bin/bash
# ============================================
# MONITORING SCRIPT - Server Lokal
# Dashboard sederhana untuk monitoring
# ============================================

# Warna output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

while true; do
    clear
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        🖥️  HARYWANG DASHBOARD - SERVER MONITOR               ║${NC}"
    echo -e "${GREEN}║              $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    # === SYSTEM INFO ===
    echo -e "\n${CYAN}📊 SYSTEM INFO${NC}"
    echo -e "────────────────────────────────────────────"
    echo -e "Hostname:    ${YELLOW}$(hostname)${NC}"
    echo -e "Uptime:      ${YELLOW}$(uptime -p)${NC}"
    echo -e "Load Avg:    ${YELLOW}$(cat /proc/loadavg | awk '{print $1, $2, $3}')${NC}"
    
    # === MEMORY ===
    echo -e "\n${CYAN}💾 MEMORY${NC}"
    echo -e "────────────────────────────────────────────"
    free -h | awk 'NR==2{printf "Used: %s / %s (%.1f%%)\n", $3, $2, $3/$2*100}'
    
    # === DISK ===
    echo -e "\n${CYAN}💿 DISK${NC}"
    echo -e "────────────────────────────────────────────"
    df -h / | awk 'NR==2{printf "Used: %s / %s (%s)\n", $3, $2, $5}'
    
    # === PM2 STATUS ===
    echo -e "\n${CYAN}🚀 PM2 APPS${NC}"
    echo -e "────────────────────────────────────────────"
    pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for app in apps:
        status = '🟢' if app['pm2_env']['status'] == 'online' else '🔴'
        name = app['name'][:20].ljust(20)
        cpu = str(app['monit']['cpu'])+'%'
        mem = str(round(app['monit']['memory']/1024/1024, 1))+'MB'
        uptime = app['pm2_env'].get('pm_uptime', 0)
        print(f'{status} {name} CPU: {cpu.ljust(6)} MEM: {mem.ljust(10)}')
except:
    print('PM2 tidak ada aplikasi')
" 2>/dev/null || pm2 list 2>/dev/null | head -10
    
    # === NETWORK ===
    echo -e "\n${CYAN}🌐 NETWORK${NC}"
    echo -e "────────────────────────────────────────────"
    # Tailscale IP
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "Not connected")
    echo -e "Tailscale:   ${YELLOW}$TAILSCALE_IP${NC}"
    
    # Local IP
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo -e "Local IP:    ${YELLOW}$LOCAL_IP${NC}"
    
    # Port check
    echo -e "\n${CYAN}🔌 PORTS${NC}"
    echo -e "────────────────────────────────────────────"
    for port in 80 3001 3002 3003; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "Port $port:    ${GREEN}● LISTENING${NC}"
        else
            echo -e "Port $port:    ${RED}○ CLOSED${NC}"
        fi
    done
    
    # === POSTGRESQL ===
    echo -e "\n${CYAN}🐘 POSTGRESQL${NC}"
    echo -e "────────────────────────────────────────────"
    if systemctl is-active --quiet postgresql; then
        echo -e "Status:      ${GREEN}● RUNNING${NC}"
        CONN=$(sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;" -t 2>/dev/null | tr -d ' ')
        echo -e "Connections: ${YELLOW}${CONN:-N/A}${NC}"
    else
        echo -e "Status:      ${RED}○ STOPPED${NC}"
    fi
    
    # === NGINX ===
    echo -e "\n${CYAN}🌐 NGINX${NC}"
    echo -e "────────────────────────────────────────────"
    if systemctl is-active --quiet nginx; then
        echo -e "Status:      ${GREEN}● RUNNING${NC}"
    else
        echo -e "Status:      ${RED}○ STOPPED${NC}"
    fi
    
    # === CLOUDFLARE TUNNEL ===
    echo -e "\n${CYAN}☁️ CLOUDFLARE TUNNEL${NC}"
    echo -e "────────────────────────────────────────────"
    if pgrep -x "cloudflared" > /dev/null; then
        echo -e "Status:      ${GREEN}● RUNNING${NC}"
    else
        echo -e "Status:      ${YELLOW}○ NOT RUNNING${NC}"
    fi
    
    # === RECENT LOGS ===
    echo -e "\n${CYAN}📝 RECENT PM2 LOGS${NC}"
    echo -e "────────────────────────────────────────────"
    pm2 logs --nostream --lines 3 2>/dev/null | tail -6 || echo "No logs"
    
    echo -e "\n${YELLOW}Press Ctrl+C to exit | Auto-refresh in 5s${NC}"
    sleep 5
done
