#!/bin/bash

echo ""
echo "========================================="
echo "   Harywang Dashboard - Starting..."
echo "========================================="
echo ""

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo ""
echo "Starting all services..."
node start.js
