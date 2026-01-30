#!/bin/bash

# Setup script untuk GPS Tracking System

echo "🚀 GPS Tracking System - Setup Script"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js installed
echo -e "\n${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if MongoDB installed or available
echo -e "\n${BLUE}Checking MongoDB...${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB found${NC}"
else
    echo "⚠️  MongoDB not found locally. Using MongoDB Atlas (cloud) instead."
    echo "    Update .env file dengan connection string dari MongoDB Atlas"
fi

# Setup Backend
echo -e "\n${BLUE}Setting up Backend...${NC}"
cd gps-backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Setup Dashboard
echo -e "\n${BLUE}Setting up Dashboard...${NC}"
cd gps-dashboard
npm install
echo -e "${GREEN}✓ Dashboard dependencies installed${NC}"
cd ..

# Create .env file if not exists
if [ ! -f gps-backend/.env ]; then
    echo -e "\n${BLUE}Creating .env file...${NC}"
    cat > gps-backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017/gps-tracker
PORT=5000
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Start Backend: cd gps-backend && npm start"
echo "2. Start Dashboard: cd gps-dashboard && npm start"
echo "3. Setup Android App in Android Studio"
echo "4. Open dashboard at http://localhost:3000"
