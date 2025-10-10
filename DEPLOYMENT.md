# 🚀 Guia de Deploy - Bitaca Cinema

## GitHub Pages - Configuração Automática

Este projeto está configurado para deploy automático no GitHub Pages usando GitHub Actions.

### Pré-requisitos

1. **Repositório no GitHub**: Crie um repositório público no GitHub
2. **Nome sugerido**: `bitaca-cinema`

### Passo a Passo

#### 1. Criar Repositório

```bash
# Na pasta do projeto
git init
git add .
git commit -m "🎬 Inicialização Bitaca Cinema - Catálogo de Produções Audiovisuais"
```

#### 2. Conectar ao GitHub

```bash
# Substitua SEU_USUARIO pelo seu username do GitHub
git remote add origin https://github.com/SEU_USUARIO/bitaca-cinema.git
git branch -M main
git push -u origin main
```

#### 3. Ativar GitHub Pages

1. Acesse o repositório no GitHub
2. Vá em **Settings** > **Pages**
3. Em **Source**, selecione:
   - Source: **GitHub Actions**
4. Aguarde o workflow executar (verá em **Actions** tab)

#### 4. Acessar o Site

Após alguns minutos, seu site estará disponível em:
```
https://SEU_USUARIO.github.io/bitaca-cinema/
```

## Estrutura do Projeto

```
bitaca-cinema/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de deploy automático
├── assets/
│   ├── css/
│   │   └── styles.css          # Estilos com paleta Bitaca
│   └── js/
│       ├── data.js             # Dados dos 25 filmes
│       └── main.js             # Interatividade
├── index.html                   # Página principal
├── robots.txt                   # SEO
├── sitemap.xml                  # Mapa do site
├── README.md                    # Documentação completa
└── DEPLOYMENT.md               # Este arquivo
```

## Deploy Automático

O workflow `.github/workflows/deploy.yml` está configurado para:
- ✅ Deploy automático a cada push na branch `main`
- ✅ Deploy manual via GitHub Actions UI
- ✅ Publicação em GitHub Pages

## Atualizações

Para atualizar o site:

```bash
# Faça suas alterações
git add .
git commit -m "📝 Descrição das mudanças"
git push origin main
```

O site será atualizado automaticamente em 1-2 minutos!

## Customização do Domínio (Opcional)

Para usar um domínio personalizado:

1. Adicione arquivo `CNAME` na raiz do projeto:
   ```
   www.bitacacinema.com.br
   ```

2. Configure DNS no seu provedor:
   ```
   CNAME  www  SEU_USUARIO.github.io
   ```

3. Em **Settings** > **Pages**, adicione o domínio customizado

## Troubleshooting

### Deploy falhou?
- Verifique a tab **Actions** para ver os logs
- Confirme que GitHub Pages está habilitado
- Certifique-se que o repositório é público

### Site não atualiza?
- Limpe cache do navegador (Ctrl+Shift+R)
- Aguarde 5 minutos e tente novamente
- Verifique se o commit foi enviado: `git log -1`

### Mudanças não aparecem?
- GitHub Pages pode ter cache de até 10 minutos
- Use modo anônimo/incógnito para testar

## Recursos Adicionais

- 📚 [GitHub Pages Docs](https://docs.github.com/pages)
- 🎯 [GitHub Actions](https://docs.github.com/actions)
- 🎨 [Paleta Bitaca](assets/css/styles.css) - Cores originais do Bitaca Café Bar

---

**Desenvolvido com ❤️ para preservar e celebrar o cinema de Capão Bonito/SP**

*Financiamento: Lei Paulo Gustavo + Política Nacional Aldir Blanc*
