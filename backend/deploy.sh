#!/bin/bash

# Bitaca Cinema Backend - Deploy Script para Cinewinx
# Uso: ./deploy.sh

set -e  # Exit on error

echo "🚀 Bitaca Cinema Backend - Deploy no Cinewinx"
echo "=============================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
DEPLOY_DIR="/var/www/bitaca-api"
SERVICE_NAME="bitaca-api"
PYTHON_VERSION="3.12"

# 1. Verificar se está no servidor
echo -e "${YELLOW}📍 Verificando ambiente...${NC}"
if [ ! -f /etc/hostname ] || [ "$(cat /etc/hostname)" != "cinewinx" ]; then
    echo -e "${RED}❌ Este script deve ser executado no servidor cinewinx!${NC}"
    echo "Execute: ssh root@162.12.204.30 'bash -s' < deploy.sh"
    exit 1
fi

# 2. Atualizar sistema
echo -e "${YELLOW}🔄 Atualizando sistema...${NC}"
apt update -qq

# 3. Instalar Python 3.12 se necessário
if ! command -v python3.12 &> /dev/null; then
    echo -e "${YELLOW}🐍 Instalando Python 3.12...${NC}"
    apt install -y software-properties-common
    add-apt-repository ppa:deadsnakes/ppa -y
    apt update
    apt install -y python3.12 python3.12-venv python3.12-dev python3-pip
else
    echo -e "${GREEN}✅ Python 3.12 já instalado${NC}"
fi

# 4. Instalar dependências do sistema
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt install -y build-essential curl git nginx certbot python3-certbot-nginx

# 5. Criar diretório do projeto
echo -e "${YELLOW}📁 Criando diretório ${DEPLOY_DIR}...${NC}"
mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}

# 6. Criar virtual environment
echo -e "${YELLOW}🔧 Criando virtual environment...${NC}"
python3.12 -m venv venv
source venv/bin/activate

# 7. Atualizar pip
echo -e "${YELLOW}⬆️  Atualizando pip...${NC}"
pip install --upgrade pip setuptools wheel

# 8. Instalar dependências Python
echo -e "${YELLOW}📥 Instalando dependências Python...${NC}"
pip install -r requirements.txt

# 9. Criar arquivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado. Configure a API key!${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

# 10. Criar serviço systemd
echo -e "${YELLOW}🔧 Configurando serviço systemd...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Bitaca Cinema Chatbot API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${DEPLOY_DIR}
Environment="PATH=${DEPLOY_DIR}/venv/bin"
ExecStart=${DEPLOY_DIR}/venv/bin/uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 11. Recarregar systemd e iniciar serviço
echo -e "${YELLOW}🔄 Iniciando serviço...${NC}"
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

# 12. Configurar Nginx
echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/${SERVICE_NAME} << 'EOF'
server {
    listen 80;
    server_name api.bitacacinema.com.br;  # ALTERE PARA SEU DOMÍNIO

    # Logs
    access_log /var/log/nginx/bitaca-api.access.log;
    error_log /var/log/nginx/bitaca-api.error.log;

    # Timeout para streaming
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Desabilitar buffering para SSE
    proxy_buffering off;
    proxy_cache off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx

# 13. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# 14. Status final
echo ""
echo -e "${GREEN}=============================================="
echo "✅ Deploy concluído com sucesso!"
echo "==============================================  ${NC}"
echo ""
echo "📊 Status do serviço:"
systemctl status ${SERVICE_NAME} --no-pager
echo ""
echo "🌐 Nginx:"
systemctl status nginx --no-pager | head -n 5
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo "1. Edite ${DEPLOY_DIR}/.env e configure a NVIDIA_API_KEY"
echo "2. Reinicie o serviço: systemctl restart ${SERVICE_NAME}"
echo "3. Configure DNS apontando para 162.12.204.30"
echo "4. Obtenha SSL: certbot --nginx -d api.bitacacinema.com.br"
echo ""
echo -e "${GREEN}📡 API disponível em:${NC}"
echo "   http://162.12.204.30"
echo "   http://api.bitacacinema.com.br (após DNS)"
echo ""
echo -e "${GREEN}📚 Documentação:${NC}"
echo "   http://162.12.204.30/docs"
echo ""
echo -e "${YELLOW}🔍 Ver logs:${NC}"
echo "   journalctl -u ${SERVICE_NAME} -f"
echo ""