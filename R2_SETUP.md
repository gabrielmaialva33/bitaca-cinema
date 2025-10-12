# Configuração Cloudflare R2 - Bitaca Cinema

## Passo 1: Criar API Keys do R2

1. Acesse o dashboard do Cloudflare: https://dash.cloudflare.com/
2. Navegue para **R2** → **Overview**
3. Clique em **Manage R2 API Tokens** (canto superior direito)
4. Clique em **Create API Token**
5. Configure o token:
   - **Token Name**: `bitaca-cinema-api`
   - **Permissions**:
     - Object Read & Write
     - Bucket Read
   - **TTL**: Sem expiração (ou escolha um período)
   - **Bucket Restrictions**: Específico para `abitaca`
6. Clique em **Create API Token**
7. **IMPORTANTE**: Copie e salve as credenciais:
   - `Access Key ID`
   - `Secret Access Key`
   - Você não poderá ver o Secret Access Key novamente!

## Passo 2: Atualizar .env Local

Adicione as seguintes variáveis ao arquivo `backend/.env`:

```bash
# Cloudflare R2 Storage
R2_ACCOUNT_ID=5e169ace5c37c07688d84589e2ee87b0
R2_ACCESS_KEY_ID=<seu-access-key-id>
R2_SECRET_ACCESS_KEY=<seu-secret-access-key>
R2_BUCKET_NAME=abitaca
R2_PUBLIC_URL=https://pub-6a1b49bce72a49679c5c9c8faee0a519.r2.dev
```

Substitua `<seu-access-key-id>` e `<seu-secret-access-key>` pelos valores gerados no Passo 1.

## Passo 3: Configurar CORS no Bucket R2

O bucket precisa aceitar uploads do frontend. Configure o CORS:

1. No dashboard do Cloudflare, vá para **R2** → **abitaca bucket**
2. Clique na aba **Settings**
3. Encontre a seção **CORS Policy**
4. Adicione a seguinte política CORS:

```json
[
  {
    "AllowedOrigins": [
      "https://www.abitaca.com.br",
      "https://abitaca.com.br",
      "http://localhost:8000"
    ],
    "AllowedMethods": [
      "GET",
      "POST",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Clique em **Save**

## Passo 4: Habilitar Acesso Público (Opcional)

Para permitir streaming direto dos vídeos:

1. No dashboard do Cloudflare, vá para **R2** → **abitaca bucket**
2. Clique na aba **Settings**
3. Em **Public Access**, clique em **Allow Access**
4. Confirme a ação

**URL Pública**: `https://pub-6a1b49bce72a49679c5c9c8faee0a519.r2.dev/`

## Passo 5: Adicionar Secrets no GitHub Actions

Para deploy automático, adicione as credenciais como secrets no GitHub:

1. Acesse seu repositório no GitHub
2. Vá para **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

### Secrets Necessários:

```
R2_ACCOUNT_ID=5e169ace5c37c07688d84589e2ee87b0
R2_ACCESS_KEY_ID=<seu-access-key-id>
R2_SECRET_ACCESS_KEY=<seu-secret-access-key>
R2_BUCKET_NAME=abitaca
R2_PUBLIC_URL=https://pub-6a1b49bce72a49679c5c9c8faee0a519.r2.dev
```

## Passo 6: Atualizar GitHub Actions Workflow

Se você tem um workflow de deploy, adicione as variáveis de ambiente:

```yaml
env:
  R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
  R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
  R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
  R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
  R2_PUBLIC_URL: ${{ secrets.R2_PUBLIC_URL }}
```

## Passo 7: Testar Upload

1. Instale as dependências:
```bash
cd backend
python3 -m pip install -r requirements.txt
```

2. Teste a conexão:
```bash
python3 -c "from r2_storage import test_connection; test_connection()"
```

3. Inicie o servidor:
```bash
python3 main.py
```

4. Acesse o site e teste o gravador de depoimentos

## Estrutura de Pastas no R2

Os vídeos serão salvos na seguinte estrutura:

```
abitaca/
└── depoimentos/
    ├── 20251012_143022_a1b2c3d4.webm
    ├── 20251012_144530_e5f6g7h8.webm
    └── ...
```

Formato do nome: `YYYYMMDD_HHMMSS_<unique-id>.webm`

## URLs de Acesso

- **Dashboard R2**: https://dash.cloudflare.com/5e169ace5c37c07688d84589e2ee87b0/r2/default/buckets/abitaca
- **URL Pública**: https://pub-6a1b49bce72a49679c5c9c8faee0a519.r2.dev/
- **Catálogo Iceberg**: https://catalog.cloudflarestorage.com/5e169ace5c37c07688d84589e2ee87b0/abitaca

## Custos Estimados

Cloudflare R2 tem preços competitivos:
- **Armazenamento**: $0.015/GB por mês
- **Operações Classe A** (PUT, LIST): $4.50/milhão
- **Operações Classe B** (GET, HEAD): $0.36/milhão
- **Egress**: GRÁTIS (sem custo de saída de dados)

Para 100 vídeos de 5MB cada:
- Armazenamento: 500MB = $0.0075/mês
- 100 uploads = $0.00045
- 1000 views = $0.00036

**Total estimado: < $0.01/mês** para uso básico

## Troubleshooting

### Erro: "R2 credentials not configured"
- Verifique se as variáveis de ambiente estão no `.env`
- Reinicie o servidor backend

### Erro: "CORS policy"
- Verifique a configuração CORS no bucket
- Certifique-se que a origem está permitida

### Erro: "Access Denied"
- Verifique as permissões do API Token
- Certifique-se que o token tem acesso ao bucket `abitaca`

### Upload falha silenciosamente
- Abra o console do navegador (F12)
- Verifique erros de CORS ou rede
- Teste o endpoint `/api/upload/presigned-url` manualmente

## Referências

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
