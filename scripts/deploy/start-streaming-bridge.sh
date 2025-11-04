#!/bin/bash

# Bitaca Play 3D Streaming Bridge - Development Start Script

set -e

echo "🚀 Starting Bitaca Play 3D Streaming Bridge..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python $python_version${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"

# Install/upgrade dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created${NC}"
    echo -e "${RED}⚠️  Please configure .env before starting${NC}"
    exit 1
fi

# Check if stream-winx-api is running
echo -e "${YELLOW}Checking stream-winx-api connection...${NC}"
STREAM_API_URL=$(grep STREAM_API_URL .env | cut -d '=' -f2 | tr -d '"')
if [ -z "$STREAM_API_URL" ]; then
    STREAM_API_URL="http://localhost:8000"
fi

if curl -s -f "$STREAM_API_URL/api/v1/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ stream-winx-api is running${NC}"
else
    echo -e "${RED}⚠️  stream-winx-api not responding at $STREAM_API_URL${NC}"
    echo -e "${YELLOW}   Make sure to start stream-winx-api first!${NC}"
fi

# Get port from .env
PORT=$(grep PORT .env | grep -v STREAM | cut -d '=' -f2)
if [ -z "$PORT" ]; then
    PORT=8001
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Bitaca Play 3D Streaming Bridge${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "API Docs:      ${YELLOW}http://localhost:$PORT/docs${NC}"
echo -e "Health Check:  ${YELLOW}http://localhost:$PORT/health${NC}"
echo -e "Productions:   ${YELLOW}http://localhost:$PORT/api/productions${NC}"
echo ""
echo -e "Press ${RED}Ctrl+C${NC} to stop"
echo ""

# Start the server
python main.py
