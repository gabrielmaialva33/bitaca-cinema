# 🔥 Firebase Setup - Sistema de Votação Bitaca Cinema

## ✅ Status Atual
- ✅ Projeto Firebase criado: `abitaca-8451c`
- ✅ Firebase config no código
- ✅ Arquivos do sistema de votação criados
- ⏳ Precisamos ativar Authentication e Firestore

---

## 📋 Passo a Passo - Configuração Rápida (5 minutos)

### 1. Ativar Firebase Authentication

1. Acesse: https://console.firebase.google.com/project/abitaca-8451c/authentication/providers

2. **Ativar Google Sign-In**:
   - Clique em "Google" na lista de provedores
   - Clique no botão "Ativar"
   - Preencha:
     - Nome público do projeto: `Bitaca Cinema`
     - Email de suporte: seu email
   - Clique em "Salvar"

3. **Ativar Email/Password**:
   - Clique em "Email/senha" na lista
   - Ativar "Email/senha"
   - Clique em "Salvar"

### 2. Criar Firestore Database

1. Acesse: https://console.firebase.google.com/project/abitaca-8451c/firestore

2. Clique em **"Criar banco de dados"**

3. Escolha o modo:
   - Selecione: **"Iniciar no modo de teste"** (para desenvolvimento)
   - Depois mudaremos para modo de produção com regras de segurança

4. Escolha a localização:
   - Recomendado: `southamerica-east1 (São Paulo)`
   - Clique em "Ativar"

5. Aguarde alguns segundos até o banco ser criado

### 3. Configurar Regras de Segurança do Firestore

1. No Firestore, vá para a aba **"Regras"**

2. Cole as seguintes regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Função auxiliar para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }

    // Função para verificar se é o próprio usuário
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Collection: users - Dados do usuário (quiz)
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    // Collection: votes - Votos individuais
    match /votes/{voteId} {
      // Qualquer usuário autenticado pode ler votos
      allow read: if isAuthenticated();

      // Apenas o dono pode criar seu próprio voto
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid
                    && !exists(/databases/$(database)/documents/votes/$(request.auth.uid + '_' + request.resource.data.filmId));

      // Não permite atualizar ou deletar votos
      allow update, delete: if false;
    }

    // Collection: films - Estatísticas agregadas dos filmes
    match /films/{filmId} {
      // Todos podem ler estatísticas
      allow read: if true;

      // Apenas via transações do backend
      allow write: if isAuthenticated();
    }
  }
}
```

3. Clique em **"Publicar"**

### 4. Criar Índices do Firestore (Opcional, mas recomendado)

1. Na aba **"Índices"** do Firestore
2. Clique em **"Adicionar índice"**
3. Crie os seguintes índices:

**Índice 1 - Votos por usuário:**
- Coleção: `votes`
- Campos:
  - `userId` - Crescente
  - `timestamp` - Decrescente
- Status da consulta: Ativado

**Índice 2 - Filmes por rating:**
- Coleção: `films`
- Campos:
  - `averageRating` - Decrescente
  - `voteCount` - Decrescente
- Status da consulta: Ativado

---

## 🧪 Testar o Sistema

### Teste Local

1. **Abra o site localmente**:
   ```bash
   cd /Users/gabrielmaia/Documents/projects/bitaca-cinema
   python3 -m http.server 8000
   ```

2. **Acesse**: http://localhost:8000

3. **Teste o fluxo completo**:
   - ✅ Clique em "Votar" em qualquer filme
   - ✅ Faça login com Google ou Email
   - ✅ Complete o quiz (3 perguntas sobre os filmes)
   - ✅ Vote em um filme (1-5 estrelas)
   - ✅ Veja o contador de votos atualizar

### Verificar no Firebase Console

1. **Authentication**: https://console.firebase.google.com/project/abitaca-8451c/authentication/users
   - Você deve ver seu usuário listado

2. **Firestore**: https://console.firebase.google.com/project/abitaca-8451c/firestore/data
   - Verifique as collections:
     - `users` - Seu resultado do quiz
     - `votes` - Seus votos
     - `films` - Estatísticas dos filmes

---

## 🔍 Estrutura do Firestore

### Collection: `users`
```javascript
{
  userId: "google:123456",
  quizPassed: true,
  quizAttempts: 1,
  lastAttempt: Timestamp,
  bestScore: 3,
  passedAt: Timestamp
}
```

### Collection: `votes`
```javascript
{
  documentId: "userId_filmId",
  userId: "google:123456",
  filmId: 1,
  rating: 5,
  timestamp: Timestamp
}
```

### Collection: `films`
```javascript
{
  documentId: "1",
  filmId: 1,
  voteCount: 42,
  totalStars: 185,
  averageRating: 4.4,
  lastUpdate: Timestamp
}
```

---

## 📊 Monitoramento

### Analytics
Os seguintes eventos são rastreados automaticamente:
- `vote_submitted` - Quando um voto é enviado
- `quiz_started` - Quando o quiz é iniciado
- `quiz_completed` - Quando o quiz é concluído
- `auth_login_success` - Login bem-sucedido
- `auth_login_failed` - Falha no login

### Firestore Usage
- Dashboard: https://console.firebase.google.com/project/abitaca-8451c/usage

---

## 🚀 Deploy para Produção

Quando estiver pronto para deploy:

1. **Atualizar regras de segurança** para modo de produção
2. **Revisar limites de quota** do Firebase
3. **Configurar backups** do Firestore
4. **Monitorar uso** e custos

---

## 🆘 Troubleshooting

### Erro: "auth/operation-not-allowed"
- Verifique se o provedor de autenticação está ativado no console

### Erro: "permission-denied" no Firestore
- Verifique se as regras de segurança foram publicadas
- Confirme que o usuário está autenticado

### Quiz não aparece após login
- Verifique o console do navegador para erros
- Confirme que o Firestore foi criado

### Votos não são salvos
- Verifique se o Firestore está acessível
- Confirme que as regras de segurança permitem escrita

---

## 📚 Documentação

- **Sistema de Votação**: `assets/js/voting/README.md`
- **Quick Start**: `assets/js/voting/QUICK_START.md`
- **Arquitetura**: `assets/js/voting/ARCHITECTURE.md`
- **Firebase Docs**: https://firebase.google.com/docs

---

## ✨ Próximos Passos

- [ ] Configurar Firebase (seguir este guia)
- [ ] Testar sistema localmente
- [ ] Fazer deploy para GitHub Pages
- [ ] Configurar domínio personalizado no Firebase
- [ ] Adicionar mais perguntas ao quiz
- [ ] Criar dashboard de estatísticas
- [ ] Implementar ranking de filmes mais votados
