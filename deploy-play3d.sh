#!/bin/bash

# ========================================
# BITACA PLAY 3D - DEPLOY SCRIPT
# Deploy completo para VPS
# ========================================

set -e

SERVER="root@162.12.204.30"
PROJECT_ROOT="/opt/bitaca-cinema"

echo "🚀 Iniciando deploy do Bitaca Play 3D..."

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 1. DEPLOY PLAY-3D FRONTEND
# ========================================
echo -e "${YELLOW}📦 1/5 Deploy Play-3D Frontend${NC}"

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    --exclude '*.md' \
    --exclude 'cinema-demo.html' \
    --exclude 'test-stream-api.html' \
    apps/play-3d/ $SERVER:$PROJECT_ROOT/apps/play-3d/

echo -e "${GREEN}✅ Play-3D frontend sincronizado${NC}"

# ========================================
# 2. DEPLOY STREAMING BRIDGE
# ========================================
echo -e "${YELLOW}📦 2/5 Deploy Streaming Bridge API${NC}"

rsync -avz --progress \
    --exclude '__pycache__' \
    --exclude '.pytest_cache' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    --exclude 'venv' \
    --exclude '.venv' \
    apps/play-3d-streaming-bridge/ $SERVER:$PROJECT_ROOT/apps/play-3d-streaming-bridge/

echo -e "${GREEN}✅ Streaming Bridge sincronizado${NC}"

# ========================================
# 3. CONFIGURAR NGINX
# ========================================
echo -e "${YELLOW}🔧 3/5 Configurando Nginx${NC}"

ssh $SERVER << 'ENDSSH'
set -e

# Copiar config do play-3d
if [ -f /opt/bitaca-cinema/apps/play-3d/nginx/conf.d/bitaca-play3d.conf ]; then
    cp /opt/bitaca-cinema/apps/play-3d/nginx/conf.d/bitaca-play3d.conf /etc/nginx/sites-available/
    ln -sf /etc/nginx/sites-available/bitaca-play3d.conf /etc/nginx/sites-enabled/
    echo "✓ Config play-3d copiado"
fi

# Testar configuração
nginx -t && echo "✓ Nginx config OK" || echo "✗ Erro no nginx config"
ENDSSH

echo -e "${GREEN}✅ Nginx configurado${NC}"

# ========================================
# 4. SETUP STREAMING BRIDGE
# ========================================
echo -e "${YELLOW}🐍 4/5 Setup Streaming Bridge${NC}"

ssh $SERVER << 'ENDSSH'
set -e

cd /opt/bitaca-cinema/apps/play-3d-streaming-bridge

# Criar venv se não existir
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Venv criado"
fi

# Ativar e instalar dependências
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependências instaladas"

# Criar .env se não existir
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
STREAM_API_URL=http://localhost:8000
PORT=8001
CORS_ORIGINS=https://play.abitaca.com.br,http://localhost:8002
CHUNK_SIZE=1048576
LOG_LEVEL=INFO
EOF
    echo "✓ .env criado"
fi

# Criar systemd service
cat > /etc/systemd/system/play3d-streaming-bridge.service << 'EOF'
[Unit]
Description=Bitaca Play 3D Streaming Bridge
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/bitaca-cinema/apps/play-3d-streaming-bridge
Environment="PATH=/opt/bitaca-cinema/apps/play-3d-streaming-bridge/venv/bin"
ExecStart=/opt/bitaca-cinema/apps/play-3d-streaming-bridge/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable play3d-streaming-bridge
systemctl restart play3d-streaming-bridge
echo "✓ Service streaming bridge configurado e iniciado"
ENDSSH

echo -e "${GREEN}✅ Streaming Bridge configurado${NC}"

# ========================================
# 5. REINICIAR SERVIÇOS
# ========================================
echo -e "${YELLOW}🔄 5/5 Reiniciando Serviços${NC}"

ssh $SERVER << 'ENDSSH'
set -e

# Reload nginx
systemctl reload nginx
echo "✓ Nginx recarregado"

# Status dos serviços
echo ""
echo "📊 Status dos serviços:"
systemctl status nginx --no-pager | head -5
systemctl status play3d-streaming-bridge --no-pager | head -5
ENDSSH

echo -e "${GREEN}✅ Serviços reiniciados${NC}"

# ========================================
# 6. VERIFICAÇÃO FINAL
# ========================================
echo ""
echo -e "${YELLOW}🔍 Verificação Final${NC}"

ssh $SERVER << 'ENDSSH'
echo ""
echo "📁 Estrutura de arquivos:"
ls -lh /opt/bitaca-cinema/apps/ | grep -E "play-3d|streaming"

echo ""
echo "🌐 Portas em uso:"
ss -tulpn | grep -E ":80|:8001|:3000" || echo "Nenhuma porta relevante encontrada"

echo ""
echo "📝 Logs recentes streaming bridge:"
journalctl -u play3d-streaming-bridge -n 10 --no-pager || echo "Service ainda não iniciado"
ENDSSH

# ========================================
# SUCESSO
# ========================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOY CONCLUÍDO COM SUCESSO!    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 URLs:${NC}"
echo -e "   Frontend: ${GREEN}https://play.abitaca.com.br${NC}"
echo -e "   Stream API: ${GREEN}http://162.12.204.30:8001${NC}"
echo ""
echo -e "${YELLOW}📊 Verificar Status:${NC}"
echo -e "   ssh $SERVER 'systemctl status play3d-streaming-bridge'"
echo ""
echo -e "${YELLOW}📝 Ver Logs:${NC}"
echo -e "   ssh $SERVER 'journalctl -u play3d-streaming-bridge -f'"
echo ""
