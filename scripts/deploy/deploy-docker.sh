#!/bin/bash

# Bitaca Cinema Backend - Docker Deploy Script
# Deploy para: cinewinx (162.12.204.30)
# Domínio: api.abitaca.com.br

set -e  # Exit on error

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
SERVER_IP="162.12.204.30"
SERVER_USER="root"
SERVER_PASSWORD="${SERVER_PASSWORD:-}"  # Deve ser definido como variável de ambiente
DEPLOY_DIR="/opt/bitaca-cinema"
DOMAIN="api.abitaca.com.br"

# Verificar se a senha foi fornecida
if [ -z "$SERVER_PASSWORD" ]; then
    echo -e "${RED}❌ Erro: SERVER_PASSWORD não definido${NC}"
    echo "Execute: export SERVER_PASSWORD='sua-senha'"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Bitaca Cinema - Docker Deploy           ║${NC}"
echo -e "${BLUE}║   Servidor: cinewinx (${SERVER_IP})   ║${NC}"
echo -e "${BLUE}║   Domínio: ${DOMAIN}           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Função para executar comandos no servidor
remote_exec() {
    sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$@"
}

# Função para copiar arquivos
remote_copy() {
    sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no -r "$@"
}

# 1. Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y sshpass
    fi
fi

# 2. Testar conexão
echo -e "${YELLOW}🔌 Testando conexão com servidor...${NC}"
if remote_exec "echo 'Conexão OK'"; then
    echo -e "${GREEN}✅ Conexão estabelecida${NC}"
else
    echo -e "${RED}❌ Falha na conexão${NC}"
    exit 1
fi

# 3. Atualizar sistema e instalar Docker
echo -e "${YELLOW}📦 Instalando Docker no servidor...${NC}"
remote_exec << 'EOF'
# Atualizar sistema
apt-get update -qq

# Instalar dependências
apt-get install -y ca-certificates curl gnupg

# Adicionar Docker GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

echo "✅ Docker instalado"
EOF

# 4. Criar diretório de deploy
echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
remote_exec "mkdir -p ${DEPLOY_DIR}/{nginx/conf.d,nginx/logs,nginx/ssl,logs}"

# 5. Copiar arquivos para o servidor
echo -e "${YELLOW}📤 Enviando arquivos para servidor...${NC}"
remote_copy \
    Dockerfile \
    docker-compose.yml \
    main.py \
    requirements.txt \
    .env.example \
    nginx/nginx.conf \
    nginx/conf.d/bitaca-api.conf \
    ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/

# Copiar nginx configs para subdiretórios
remote_exec "mv ${DEPLOY_DIR}/nginx.conf ${DEPLOY_DIR}/nginx/"
remote_exec "mv ${DEPLOY_DIR}/bitaca-api.conf ${DEPLOY_DIR}/nginx/conf.d/"

# 6. Configurar .env
echo -e "${YELLOW}⚙️  Configurando variáveis de ambiente...${NC}"
remote_exec << EOF
cd ${DEPLOY_DIR}
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Arquivo .env criado - CONFIGURE A NVIDIA_API_KEY manualmente!"
    echo "Execute no servidor: nano ${DEPLOY_DIR}/.env"
else
    echo "ℹ️  Arquivo .env já existe"
fi
EOF

# 7. Build e start dos containers
echo -e "${YELLOW}🐳 Construindo e iniciando containers...${NC}"
remote_exec << EOF
cd ${DEPLOY_DIR}

# Parar containers existentes
docker compose down 2>/dev/null || true

# Build
docker compose build --no-cache

# Start
docker compose up -d

# Aguardar containers iniciarem
sleep 10

# Verificar status
docker compose ps
EOF

# 8. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
remote_exec << 'EOF'
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
echo "✅ Firewall configurado"
EOF

# 9. Verificar se API está respondendo
echo -e "${YELLOW}🔍 Verificando health da API...${NC}"
sleep 5
if remote_exec "curl -f http://localhost/health"; then
    echo -e "${GREEN}✅ API está saudável!${NC}"
else
    echo -e "${RED}⚠️  API não está respondendo corretamente${NC}"
fi

# 10. Mostrar logs
echo -e "${YELLOW}📋 Últimas linhas dos logs:${NC}"
remote_exec "cd ${DEPLOY_DIR} && docker compose logs --tail=20"

# 11. Status final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deploy Concluído! 🎉              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Informações:${NC}"
echo -e "   API URL: http://${DOMAIN}"
echo -e "   Health Check: http://${DOMAIN}/health"
echo -e "   Documentação: http://${DOMAIN}/docs"
echo ""
echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
echo -e "   Ver logs: ssh root@${SERVER_IP} 'cd ${DEPLOY_DIR} && docker compose logs -f'"
echo -e "   Restart: ssh root@${SERVER_IP} 'cd ${DEPLOY_DIR} && docker compose restart'"
echo -e "   Stop: ssh root@${SERVER_IP} 'cd ${DEPLOY_DIR} && docker compose down'"
echo -e "   Status: ssh root@${SERVER_IP} 'cd ${DEPLOY_DIR} && docker compose ps'"
echo ""
echo -e "${GREEN}✅ Cloudflare já está gerenciando SSL!${NC}"
echo ""