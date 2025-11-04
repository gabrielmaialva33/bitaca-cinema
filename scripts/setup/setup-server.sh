#!/bin/bash

# Setup script for initial server configuration
# Run this on the server at /root/bitaca-cinema

echo "🔧 Bitaca Cinema Server Setup"
echo "=============================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Variables
DEPLOY_DIR="/root/bitaca-cinema"

# Ensure we're in the right directory
cd "$DEPLOY_DIR" || exit 1

echo "📁 Current directory: $(pwd)"

# Copy nginx configurations
echo "🔧 Setting up nginx configurations..."

# Copy nginx configs to system
if [ -d "nginx-server-configs" ]; then
    cp -f nginx-server-configs/bitaca-api.conf /etc/nginx/sites-available/
    cp -f nginx-server-configs/bitaca-www.conf /etc/nginx/sites-available/

    echo "✅ Nginx configs copied to /etc/nginx/sites-available/"
else
    echo "⚠️  nginx-server-configs directory not found, skipping nginx setup"
fi

# Enable nginx sites
echo "🔗 Enabling nginx sites..."
ln -sf /etc/nginx/sites-available/bitaca-api.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bitaca-www.conf /etc/nginx/sites-enabled/

# Remove default nginx site if exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "✅ Removed default nginx site"
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"

    # Reload nginx
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Prepare backend files
echo "📦 Preparing backend files..."
cp -f apps/backend/*.py .
cp -rf apps/backend/agents .
cp -f apps/backend/requirements.txt .
cp -f apps/frontend/assets/data/embeddings.json .

# Frontend via GitHub Pages proxy
echo "📦 Frontend via GitHub Pages proxy - no files to copy"
# www.abitaca.com.br proxies to https://gabrielmaialva33.github.io/bitaca-cinema/
# This saves VPS resources and auto-updates!

# Create necessary directories
echo "📂 Creating directories..."
mkdir -p logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please edit .env and add your NVIDIA_API_KEY and other credentials"
    else
        echo "❌ .env.example not found. Please create .env file with required variables"
    fi
else
    echo "✅ .env file exists"
fi

# Build and start Docker containers (API only, no nginx)
echo "🐳 Building and starting API container..."
docker compose down
docker compose build --no-cache api
docker compose up -d api

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker compose ps

# Health check
echo "🔍 Checking API health..."
API_HEALTH=$(curl -s http://localhost:3000/health)
if [ $? -eq 0 ]; then
    echo "✅ API is healthy"
    echo "$API_HEALTH" | head -3
else
    echo "⚠️  API health check failed"
fi

# Check nginx status
echo "🔍 Checking nginx status..."
systemctl status nginx --no-pager | head -10

echo ""
echo "✅ Setup complete!"
echo "================================"
echo "📊 API Health: http://api.abitaca.com.br/health"
echo "🌐 Frontend: http://www.abitaca.com.br"
echo ""
echo "📝 Next steps:"
echo "1. Check .env file for API keys"
echo "2. Verify SSL certificates (managed by Cloudflare)"
echo "3. Test the application"
echo ""
echo "📚 Useful commands:"
echo "- docker compose logs -f api       # View API logs"
echo "- systemctl status nginx           # Check nginx status"
echo "- nginx -t                         # Test nginx config"
echo "- docker compose restart api       # Restart API"