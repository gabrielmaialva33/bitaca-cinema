#!/bin/bash

# Fast deployment script using git pull strategy
# This is much faster than rsync for large projects

SERVER="root@162.12.204.30"
DEPLOY_DIR="/root/bitaca-cinema"

echo "🚀 Fast Deploy to Production"
echo "============================"

# Execute deployment on server
ssh $SERVER << 'EOF'
cd /root/bitaca-cinema

echo "📥 Pulling latest code..."
git pull origin main

echo "📁 Preparing files..."
# Copy backend files to root for Docker
cp -f apps/backend/*.py .
cp -rf apps/backend/agents .
cp -f apps/backend/requirements.txt .
cp -f apps/frontend/assets/data/embeddings.json .

# Prepare frontend files
mkdir -p www
cp -rf apps/frontend/*.html www/
cp -rf apps/frontend/assets www/
cp -f apps/frontend/robots.txt www/ 2>/dev/null || true
cp -f apps/frontend/sitemap.xml www/ 2>/dev/null || true

# Prepare nginx
mkdir -p nginx/conf.d nginx/logs nginx/ssl logs
cp -rf apps/backend/nginx/* nginx/ 2>/dev/null || true

echo "🐳 Restarting containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "⏳ Waiting for services..."
sleep 10

echo "✅ Deployment complete!"
docker compose ps
EOF

echo ""
echo "🎉 Deployment finished!"
echo "📊 Check status: https://api.abitaca.com.br/health"
echo "🌐 Frontend: https://www.abitaca.com.br"