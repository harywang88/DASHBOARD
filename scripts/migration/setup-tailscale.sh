#!/bin/bash
# ============================================
# SETUP TAILSCALE - Remote Access
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== SETUP TAILSCALE ===${NC}"

# Install jika belum ada
if ! command -v tailscale &> /dev/null; then
    echo -e "${CYAN}Installing Tailscale...${NC}"
    curl -fsSL https://tailscale.com/install.sh | sh
fi

# Connect
echo -e "\n${CYAN}Connecting to Tailscale...${NC}"
sudo tailscale up

# Show IP
echo -e "\n${GREEN}=== TAILSCALE READY! ===${NC}"
TAILSCALE_IP=$(tailscale ip -4)
echo -e "IP Address: ${YELLOW}$TAILSCALE_IP${NC}"
echo -e "Akses dari device lain di jaringan Tailscale:"
echo -e "  Dashboard: ${YELLOW}http://$TAILSCALE_IP${NC}"
echo -e "  SSH:       ${YELLOW}ssh ubuntu@$TAILSCALE_IP${NC}"

# Status
echo -e "\n${CYAN}Status:${NC}"
tailscale status
