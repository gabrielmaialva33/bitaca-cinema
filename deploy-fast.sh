#!/bin/bash

# Fast deployment script using git pull strategy
# Deploys to /root/bitaca-cinema with system nginx

SERVER="root@162.12.204.30"
DEPLOY_DIR="/root/bitaca-cinema"

echo "🚀 Fast Deploy to Production"
echo "============================"

# Execute deployment on server
ssh $SERVER << 'EOF'
cd /root/bitaca-cinema

echo "📥 Pulling latest code..."
git pull origin main

echo "📁 Preparing backend files..."
# Copy backend files to root for Docker
cp -f apps/backend/*.py .
cp -rf apps/backend/agents .
cp -f apps/backend/requirements.txt .
cp -f apps/frontend/assets/data/embeddings.json .

echo "📁 Frontend via GitHub Pages proxy (no files to copy)"
# Frontend is proxied from https://gabrielmaialva33.github.io/bitaca-cinema/
# No need to copy files - saves resources and auto-updates!

echo "🔧 Updating nginx configs..."
# Copy nginx configs to system nginx if they exist
if [ -d "nginx-server-configs" ]; then
    sudo cp -f nginx-server-configs/bitaca-api.conf /etc/nginx/sites-available/
    sudo cp -f nginx-server-configs/bitaca-www.conf /etc/nginx/sites-available/

    # Enable sites if not already enabled
    [ ! -L /etc/nginx/sites-enabled/bitaca-api.conf ] && sudo ln -sf /etc/nginx/sites-available/bitaca-api.conf /etc/nginx/sites-enabled/
    [ ! -L /etc/nginx/sites-enabled/bitaca-www.conf ] && sudo ln -sf /etc/nginx/sites-available/bitaca-www.conf /etc/nginx/sites-enabled/

    # Test and reload nginx
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "🐳 Restarting API container..."
# Only restart the API container (no nginx in docker)
docker compose down
docker compose build --no-cache api
docker compose up -d api

echo "⏳ Waiting for API to start..."
sleep 10

echo "✅ Deployment complete!"
docker compose ps
sudo systemctl status nginx --no-pager

# Health check
echo "🔍 Checking services..."
curl -s http://localhost:3000/health | head -1
EOF

echo ""
echo "🧹 Purging Cloudflare cache..."
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    # Purge all cache
    curl -X POST "https://api.cloudflare.com/client/v4/zones/523a4a3adef5549c21bc1dfcc0834c09/purge_cache" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' \
      -s | grep -q '"success":true' && echo "✅ Cloudflare cache purged!" || echo "⚠️  Cache purge failed"

    # Set cache level to bypass (no caching)
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/523a4a3adef5549c21bc1dfcc0834c09/settings/cache_level" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"value":"bypass"}' \
      -s | grep -q '"success":true' && echo "✅ Cache level set to bypass" || echo "⚠️  Cache level update failed"
else
    echo "⚠️  CLOUDFLARE_API_TOKEN not set, skipping Cloudflare configuration"
fi

echo ""
echo "🎉 Deployment finished!"
echo "📊 API: https://api.abitaca.com.br/health"
echo "🌐 Frontend: https://www.abitaca.com.br"