# Bitaca Cinema - Chatbot Backend API

Backend proxy para o chatbot Bitaca AI usando **Python + FastAPI + NVIDIA NIM**.

## Características

- ✅ **FastAPI** - Framework moderno e rápido
- ✅ **Streaming SSE** - Respostas em tempo real
- ✅ **Rate Limiting** - Proteção contra abuso (60 req/min por IP)
- ✅ **CORS** configurado
- ✅ **Health Check** endpoint
- ✅ **Async** - Performance máxima
- ✅ **Logs estruturados**
- ✅ **Documentação automática** (Swagger/OpenAPI)

---

## Requisitos

- Python 3.12+
- NVIDIA NIM API Key
- Ubuntu 24.04 LTS (servidor cinewinx)

---

## Instalação Local

### 1. Clone o repositório

```bash
git clone https://github.com/gabrielmaialva33/bitaca-cinema.git
cd bitaca-cinema/backend
```

### 2. Crie virtual environment

```bash
python3.12 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale dependências

```bash
pip install -r requirements.txt
```

### 4. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite .env e adicione sua NVIDIA_API_KEY
```

### 5. Execute o servidor

```bash
# Desenvolvimento (com reload)
uvicorn main:app --reload --port 3000

# Produção
uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
```

### 6. Acesse a documentação

```
http://localhost:3000/docs
```

---

## Deploy no Servidor Cinewinx

### Opção A: Deploy Automático via GitHub Actions (Recomendado) 🚀

**Setup único** (primeira vez):

1. Configure os GitHub Secrets (ver [.github/SECRETS.md](.github/SECRETS.md)):
   - `SSH_PRIVATE_KEY` - Chave SSH para acessar o servidor
   - `NVIDIA_API_KEY` - Chave da API NVIDIA NIM
   - `ALLOWED_ORIGINS` - Origens CORS permitidas

2. Faça push para a branch `main`:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

3. O deploy é **automático**! Acesse **Actions** no GitHub para acompanhar.

**Deploy manual** (quando necessário):

```bash
# Usando SSH key
make deploy-ci

# Apenas atualizar arquivos
make deploy-files

# Ver logs remotos
make remote-logs
```

### Opção B: Deploy Docker com Senha

```bash
# Deploy completo com Docker
make deploy

# Ou diretamente
chmod +x deploy-docker.sh
./deploy-docker.sh
```

### Opção C: Deploy Manual (Systemd)

```bash
# 1. Conectar ao servidor
ssh root@162.12.204.30

# 2. Instalar Python 3.12
apt update
apt install -y software-properties-common
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.12 python3.12-venv python3.12-dev python3-pip

# 3. Criar diretório
mkdir -p /var/www/bitaca-api
cd /var/www/bitaca-api

# 4. Transferir arquivos (do seu computador)
scp main.py requirements.txt .env.example root@162.12.204.30:/var/www/bitaca-api/

# 5. Criar virtual environment
python3.12 -m venv venv
source venv/bin/activate

# 6. Instalar dependências
pip install -r requirements.txt

# 7. Configurar .env
cp .env.example .env
nano .env  # Adicione sua API key

# 8. Criar serviço systemd
cat > /etc/systemd/system/bitaca-api.service << 'EOF'
[Unit]
Description=Bitaca Cinema Chatbot API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/bitaca-api
Environment="PATH=/var/www/bitaca-api/venv/bin"
ExecStart=/var/www/bitaca-api/venv/bin/uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Iniciar serviço
systemctl daemon-reload
systemctl enable bitaca-api
systemctl start bitaca-api

# 10. Verificar status
systemctl status bitaca-api
```

---

## Docker (Produção)

### Arquitetura

```
┌─────────────────────────────────────────┐
│         Cloudflare (SSL/CDN)            │
│         api.abitaca.com.br              │
└────────────────┬────────────────────────┘
                 │ HTTPS/HTTP
┌────────────────▼────────────────────────┐
│         Nginx (Reverse Proxy)           │
│  - Rate limiting (100 req/min global)   │
│  - Real IP from Cloudflare             │
│  - Gzip compression                     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      FastAPI (4 workers)                │
│  - Rate limiting (60 req/min por IP)    │
│  - CORS middleware                      │
│  - SSE streaming                        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         NVIDIA NIM API                  │
│  https://integrate.api.nvidia.com/v1    │
└─────────────────────────────────────────┘
```

### Comandos Docker (Local)

```bash
# Build e start
make build && make up

# Ver logs
make logs

# Ver logs da API
make logs ARGS="api"

# Status
make ps

# Restart
make restart

# Parar
make down

# Limpar tudo
make clean

# Health check local
make health
```

### Comandos Remotos

```bash
# Ver logs do servidor
make remote-logs

# Status dos containers
make remote-ps

# Restart no servidor
make remote-restart

# Parar containers
make remote-down

# Shell no container
make remote-shell

# Health check remoto
make health-remote

# Estatísticas
make stats-remote

# Backup do .env
make backup-env
```

### Health Check

O Docker tem health checks configurados:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Status:
```bash
docker compose ps
# api: healthy
# nginx: healthy
```

---

## Endpoints

### GET /health

Health check do servidor.

**Resposta:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "model": "qwen/qwen3-next-80b-a3b-thinking",
  "uptime": 1234.56
}
```

### POST /api/chat/completions

Chat completions com streaming SSE.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Olá, me conte sobre o Bitaca Cinema"}
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "top_p": 0.9,
  "stream": true
}
```

**Response (SSE):**
```
data: {"id":"...", "choices":[{"delta":{"content":"Olá"}}]}

data: {"id":"...", "choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

### POST /api/embeddings

Gerar embeddings de texto.

**Request:**
```json
{
  "input": "Bitaca Cinema é um projeto cultural",
  "model": "nvidia/nv-embedqa-e5-v5"
}
```

**Response:**
```json
{
  "data": [
    {
      "embedding": [0.123, -0.456, ...],
      "index": 0
    }
  ],
  "model": "nvidia/nv-embedqa-e5-v5"
}
```

---

## Configuração Nginx (Docker)

### Arquivos de Configuração

**nginx/nginx.conf** - Configuração principal
- 4 worker processes (1 por CPU core)
- Gzip habilitado
- Rate limiting configurado

**nginx/conf.d/bitaca-api.conf** - Site config
- Upstream com FastAPI
- Cloudflare real IP detection
- Rate limiting (60 req/min API, 100 req/min global)
- Timeouts de 300s para streaming
- Proxy buffering desabilitado (necessário para SSE)

### Cloudflare SSL

**Modo configurado**: Flexible SSL

```
Browser → [HTTPS] → Cloudflare → [HTTP] → Nginx → FastAPI
```

- Cloudflare gerencia certificados SSL automaticamente
- Conexão entre Cloudflare e servidor é HTTP (porta 80)
- Não é necessário Let's Encrypt ou certificados no servidor
- Cloudflare fornece proteção DDoS e CDN

### Rate Limiting

Duas camadas de proteção:

1. **Nginx** (100 req/min global)
   ```nginx
   limit_req_zone $binary_remote_addr zone=global_limit:10m rate=100r/m;
   ```

2. **FastAPI** (60 req/min por IP nos endpoints /api/*)
   ```python
   if not check_rate_limit(client_ip):
       raise HTTPException(status_code=429, detail="Rate limit exceeded")
   ```

---

## Comandos Úteis

### Ver logs em tempo real

```bash
journalctl -u bitaca-api -f
```

### Reiniciar serviço

```bash
systemctl restart bitaca-api
```

### Status do serviço

```bash
systemctl status bitaca-api
```

### Testar API localmente

```bash
# Health check
curl http://localhost:3000/health

# Chat completion (streaming)
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Olá"}],
    "stream": true
  }'
```

---

## Performance

| Métrica | Valor |
|---------|-------|
| Req/s (4 workers) | ~5,000-10,000 |
| Latência média | ~50-100ms |
| Uso de memória | ~200MB |
| Cold start | ~500ms |
| Conexões simultâneas | ~10,000+ |

---

## Monitoramento

### Logs

```bash
# Logs do serviço
journalctl -u bitaca-api -f

# Logs do Nginx
tail -f /var/log/nginx/bitaca-api.access.log
tail -f /var/log/nginx/bitaca-api.error.log
```

### Métricas

Acesse: `http://162.12.204.30/metrics` (se Prometheus habilitado)

---

## Troubleshooting

### Serviço não inicia

```bash
# Ver logs de erro
journalctl -u bitaca-api -n 50 --no-pager

# Verificar porta
netstat -tulpn | grep 3000

# Verificar Python
which python3.12
python3.12 --version
```

### Erro de API Key

```bash
# Verificar .env
cat /var/www/bitaca-api/.env | grep NVIDIA_API_KEY

# Reiniciar após alterar
systemctl restart bitaca-api
```

### Streaming não funciona

```bash
# Verificar Nginx buffering
nginx -T | grep buffering

# Deve ter:
# proxy_buffering off;
# proxy_cache off;
```

---

## Segurança

- ✅ API key não exposta no frontend
- ✅ Rate limiting por IP (60 req/min)
- ✅ CORS restrito a origens permitidas
- ✅ SSL/HTTPS configurado
- ✅ Headers de segurança (X-Frame-Options, etc)
- ✅ Firewall configurado (UFW)

---

## Stack Tecnológica

- **Python 3.12** - Linguagem
- **FastAPI** - Framework web
- **Uvicorn** - ASGI server
- **HTTPX** - Cliente HTTP async
- **Pydantic** - Validação de dados
- **NVIDIA NIM API** - LLM backend

---

## Licença

MIT License - Bitaca Cinema Project

---

## Autor

**Gabriel Maia**
- GitHub: [@gabrielmaialva33](https://github.com/gabrielmaialva33)
- Projeto: Bitaca Cinema - Capão Bonito/SP

---

## Suporte

- 📧 Email: cultura@capaobonito.sp.gov.br
- 📱 WhatsApp: (15) 3542-3553
- 🌐 Site: https://gabrielmaialva33.github.io/bitaca-cinema/

---

**Última atualização:** Outubro 2025