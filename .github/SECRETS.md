# GitHub Secrets Configuration

Para que o deploy automático do backend funcione, você precisa configurar os seguintes secrets no GitHub:

## Como Adicionar Secrets

1. Vá para: **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**
3. Adicione cada secret abaixo

## Secrets Necessários

### 1. SSH_PRIVATE_KEY (OBRIGATÓRIO)

**Descrição**: Chave SSH privada para acessar o servidor cinewinx

**Como obter**:

```bash
# No seu computador local (onde já tem acesso SSH ao servidor)
cat ~/.ssh/id_rsa
```

**Importante**:

- Copie TODO o conteúdo, incluindo as linhas `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`
- Se você usa uma chave diferente (id_ed25519, por exemplo), use essa
- A chave pública correspondente já deve estar em `root@162.12.204.30:~/.ssh/authorized_keys`

### 2. NVIDIA_API_KEY (OBRIGATÓRIO)

**Descrição**: Chave de API da NVIDIA NIM

**Como obter**:

- Acesse: https://build.nvidia.com/
- Faça login e gere uma API key
- Copie a chave que começa com `nvapi-`

**Formato**:

```
nvapi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. ALLOWED_ORIGINS (OPCIONAL)

**Descrição**: Origens permitidas para CORS

**Valor padrão**:

```
https://gabrielmaialva33.github.io,http://localhost:8000,https://abitaca.com.br
```

**Quando modificar**: Se você adicionar novos domínios que precisam acessar a API

## Verificação

Após adicionar os secrets, você pode verificar se estão configurados:

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Você deve ver:
    - ✅ SSH_PRIVATE_KEY
    - ✅ NVIDIA_API_KEY
    - ✅ ALLOWED_ORIGINS (opcional)

## Testando o Deploy

Depois de configurar os secrets:

1. Faça um commit e push para a branch `main`:
   ```bash
   git add .
   git commit -m "feat: configure auto-deploy"
   git push origin main
   ```

2. Acesse **Actions** no GitHub para ver o workflow rodando

3. O deploy será executado automaticamente sempre que você fizer push para `main` e modificar arquivos na pasta
   `backend/`

## Deploy Manual

Você também pode disparar o deploy manualmente:

1. Vá para **Actions**
2. Selecione **"Deploy Backend to cinewinx"**
3. Clique em **"Run workflow"**
4. Selecione a branch e clique em **"Run workflow"**

## Verificando o Deploy

Após o deploy concluir:

```bash
# Health check
curl http://api.abitaca.com.br/health

# Testar chat
curl -X POST http://api.abitaca.com.br/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Olá"}],"stream":false}'
```

## Troubleshooting

### Erro: "Host key verification failed"

O workflow automaticamente adiciona o host ao `known_hosts`, mas se houver problemas:

```bash
ssh-keyscan -H 162.12.204.30 >> ~/.ssh/known_hosts
```

### Erro: "Permission denied (publickey)"

Verifique se a chave SSH privada está correta:

1. No seu computador, teste a conexão:
   ```bash
   ssh -v root@162.12.204.30
   ```

2. Se funcionar localmente mas falhar no GitHub, copie novamente a chave privada para o secret

3. Verifique se a chave pública está no servidor:
   ```bash
   ssh root@162.12.204.30 "cat ~/.ssh/authorized_keys"
   ```

### Erro: "Health check failed"

Verifique os logs do container:

```bash
make remote-logs

# Ou diretamente:
ssh root@162.12.204.30 "cd /opt/bitaca-cinema && docker compose logs -f"
```

## Deploy Local com SSH Key

Para fazer deploy do seu computador usando SSH key (sem senha):

```bash
# Deploy completo
make deploy-ci

# Apenas arquivos
make deploy-files

# Ver logs remotos
make remote-logs

# Restart remoto
make remote-restart
```

## Segurança

⚠️ **IMPORTANTE**:

- **NUNCA** comite a chave privada SSH no repositório
- **NUNCA** comite o arquivo `.env` com a API key
- Use sempre GitHub Secrets para informações sensíveis
- Mantenha o `.env.example` sem valores reais
- Revogue e gere novas chaves se houver exposição acidental
