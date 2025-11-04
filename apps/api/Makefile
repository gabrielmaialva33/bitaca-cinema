# Bitaca Cinema Backend - Makefile
# Comandos úteis para desenvolvimento e deploy

.PHONY: help build up down restart logs ps deploy clean test

# Variáveis
COMPOSE = docker compose
SERVER = root@162.12.204.30
DEPLOY_DIR = /opt/bitaca-cinema

help: ## Mostra esta ajuda
	@echo "Bitaca Cinema - Backend Commands"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Desenvolvimento Local
build: ## Build containers
	$(COMPOSE) build

up: ## Start containers
	$(COMPOSE) up -d

down: ## Stop containers
	$(COMPOSE) down

restart: ## Restart containers
	$(COMPOSE) restart

logs: ## Ver logs (use ARGS para filtrar, ex: make logs ARGS="api")
	$(COMPOSE) logs -f $(ARGS)

ps: ## Status dos containers
	$(COMPOSE) ps

# Deploy
deploy: ## Deploy completo para servidor (requer SERVER_PASSWORD env var)
	@if [ -z "$$SERVER_PASSWORD" ]; then \
		echo "❌ Erro: SERVER_PASSWORD não definido"; \
		echo "Execute: export SERVER_PASSWORD='sua-senha'"; \
		exit 1; \
	fi
	chmod +x deploy-docker.sh
	./deploy-docker.sh

deploy-ci: ## Deploy via SSH key (para CI/CD ou chave configurada)
	@echo "📤 Enviando arquivos para servidor..."
	rsync -avz --delete \
		--exclude '.git' \
		--exclude '.env' \
		--exclude '__pycache__' \
		--exclude '*.pyc' \
		--exclude 'logs/' \
		--exclude '.github/' \
		./ $(SERVER):$(DEPLOY_DIR)/
	@echo "🐳 Rebuilding e reiniciando containers..."
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose down && docker compose build --no-cache && docker compose up -d"
	@echo "⏳ Aguardando containers iniciarem..."
	@sleep 15
	@echo "🔍 Verificando health..."
	@curl -f http://api.abitaca.com.br/health && echo "\n✅ Deploy concluído!" || echo "\n❌ Health check falhou"

deploy-files: ## Envia apenas arquivos (sem rebuild)
	rsync -avz \
		--include='main.py' \
		--include='requirements.txt' \
		--include='.env' \
		--exclude='*' \
		./ $(SERVER):$(DEPLOY_DIR)/
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose restart api"

# Servidor remoto
remote-logs: ## Ver logs do servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose logs -f"

remote-ps: ## Status containers no servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose ps"

remote-restart: ## Restart no servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose restart"

remote-down: ## Para containers no servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose down"

remote-shell: ## Shell no container da API (servidor)
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose exec api bash"

# Manutenção
clean: ## Limpa containers, images e volumes locais
	$(COMPOSE) down -v
	docker system prune -f

clean-remote: ## Limpa no servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose down -v && docker system prune -af"

# Health checks
health: ## Testa health local
	curl -f http://localhost/health

health-remote: ## Testa health do servidor
	curl -f http://api.abitaca.com.br/health

# Testing
test-local: ## Testa API localmente
	curl -X POST http://localhost/api/chat/completions \
		-H "Content-Type: application/json" \
		-d '{"messages":[{"role":"user","content":"Olá"}],"stream":false}'

test-remote: ## Testa API no servidor
	curl -X POST http://api.abitaca.com.br/api/chat/completions \
		-H "Content-Type: application/json" \
		-d '{"messages":[{"role":"user","content":"Olá"}],"stream":false}'

# Backup
backup-env: ## Backup .env do servidor
	scp $(SERVER):$(DEPLOY_DIR)/.env ./backup-env-$(shell date +%Y%m%d-%H%M%S)

# Monitoring
stats: ## Estatísticas dos containers
	$(COMPOSE) stats

stats-remote: ## Estatísticas no servidor
	ssh $(SERVER) "cd $(DEPLOY_DIR) && docker compose stats --no-stream"