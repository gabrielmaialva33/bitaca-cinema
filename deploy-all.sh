#!/bin/bash

# ========================================
# DEPLOY COMPLETO - ABITACA CINEMA
# Deploy de todos os sites (Mostra + Galeria)
# ========================================

set -e

SERVER_USER="root"
SERVER_HOST="162.12.204.30"
SERVER_PATH="/opt/bitaca-cinema"

echo "🚀 Iniciando deploy completo..."
echo ""

# 1. Deploy Frontend (Mostra de Cinema)
echo "📦 1/4 - Enviando frontend da Mostra de Cinema..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    apps/frontend/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/apps/frontend/

# 2. Deploy Galeria Bitaca
echo ""
echo "🎨 2/4 - Enviando frontend da Galeria Bitaca..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    apps/galeria-bitaca/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/apps/galeria-bitaca/

# 3. Deploy Nginx configs
echo ""
echo "⚙️  3/4 - Enviando configurações Nginx..."
rsync -avz --progress \
    nginx/conf.d/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/nginx/conf.d/

# 4. Configurar no servidor
echo ""
echo "🔧 4/4 - Configurando no servidor..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    # Copiar configs do nginx
    cp /opt/bitaca-cinema/nginx/conf.d/*.conf /etc/nginx/sites-available/

    # Criar symlinks
    ln -sf /etc/nginx/sites-available/bitaca-www.conf /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/bitaca-api.conf /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/bitaca-galeria.conf /etc/nginx/sites-enabled/

    # Testar configuração
    nginx -t

    # Recarregar nginx
    systemctl reload nginx

    echo "✅ Configuração aplicada!"
EOF

echo ""
echo "✅ Deploy completo realizado com sucesso!"
echo ""
echo "📍 URLs disponíveis:"
echo "   - Mostra de Cinema: https://abitaca.com.br"
echo "   - Mostra de Cinema: https://www.abitaca.com.br"
echo "   - Galeria Bitaca:   https://galeria.abitaca.com.br"
echo "   - API Backend:      https://api.abitaca.com.br"
echo ""
echo "⚠️  Próximos passos:"
echo "   1. Adicionar DNS: galeria.abitaca.com.br no Cloudflare"
echo "   2. Configurar SSL com Certbot para galeria.abitaca.com.br"
echo ""
