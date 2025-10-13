# Bitaca Play 3D

Experiência interativa 3D para explorar o universo cultural de Capão Bonito/SP.

## Visão Geral

Bitaca Play 3D é uma aplicação web imersiva construída com **Three.js** que transforma o catálogo de produções audiovisuais em uma experiência 3D navegável. Os usuários podem explorar 3 mundos temáticos, interagir com a avatar Derona (guia com IA), e descobrir produções de forma visual e interativa.

## Mundos Temáticos

### 1. **Patrimônio & Memória**
- Ambiente estilo museu/galeria
- 9 produções sobre história, gastronomia e memória cultural
- Elementos interativos: pilares dourados, portais, cards 3D

### 2. **Música**
- Ambiente de palco/show
- 8 produções musicais (viola, choro, rock, hip-hop)
- Elementos: instrumentos 3D, palco, luzes dinâmicas

### 3. **Meio Ambiente**
- Ambiente natural/urbano
- 7 produções sobre natureza e sustentabilidade
- Elementos: floresta, cidade, ecossistema

## Stack Técnico

```javascript
{
  "3D Engine": "Three.js v0.160.0",
  "Animation": "GSAP 3.12.5",
  "Controls": [
    "OrbitControls (menu/seleção)",
    "PointerLockControls (navegação first-person)"
  ],
  "Loaders": ["GLTFLoader", "TextureLoader"],
  "Backend Integration": "FastAPI (api.abitaca.com.br)",
  "AI": "Bitaca AI (NVIDIA NIM + Multi-Agent System)"
}
```

## Estrutura do Projeto

```
play-3d/
├── index.html                  # Página principal
├── assets/
│   ├── css/
│   │   ├── play3d.css         # Estilos principais
│   │   └── avatar.css         # Estilos do avatar
│   ├── js/
│   │   ├── main.js            # Entry point Three.js
│   │   ├── components/
│   │   │   ├── derona-avatar.js    # Avatar 3D da Derona
│   │   │   ├── portal.js           # Portais entre mundos
│   │   │   └── film-card-3d.js     # Cards de filmes 3D
│   │   ├── scenes/
│   │   │   ├── patrimonio-world.js # Mundo Patrimônio
│   │   │   ├── musica-world.js     # Mundo Música
│   │   │   └── ambiente-world.js   # Mundo Ambiente
│   │   └── utils/
│   │       ├── api-client.js       # Cliente API Backend
│   │       └── audio-manager.js    # Gerenciador de áudio
│   ├── models/                # Modelos 3D (GLTF/GLB)
│   └── images/                # Texturas e imagens
└── nginx/
    └── conf.d/
        └── bitaca-play3d.conf # Configuração nginx
```

## Controles

### Navegação
- **W A S D** ou **Setas** - Mover câmera
- **Mouse** - Olhar ao redor
- **E** - Interagir com objetos
- **ESC** - Abrir menu

### Interações
- **Click nos portais** - Trocar de mundo
- **Aproximar dos cards** - Ver detalhes da produção
- **Botão "Chamar Derona"** - Abrir diálogo com IA

## Integração com IA

O Play 3D está integrado com o backend existente do Bitaca Cinema:

```javascript
// Exemplo de uso
import { apiClient } from './utils/api-client.js';

// Chat com Derona
const response = await apiClient.chat('Quais produções são sobre música?');

// Recomendações personalizadas
const recommendations = await apiClient.getRecommendations({
  category: 'patrimonio',
  limit: 5
});

// Busca semântica
const results = await apiClient.search('gastronomia regional');
```

### Agentes Disponíveis

1. **CinemaAgent** - Informações sobre produções, diretores, temas
2. **CulturalAgent** - Leis culturais (Paulo Gustavo, Aldir Blanc)
3. **DiscoveryAgent** - Recomendações e busca semântica (RAG)

## Deploy

### 1. Configurar DNS

```bash
cloudflared tunnel route dns 39d5b892-d2d6-45b0-b2a9-1b50f1e17939 play.abitaca.com.br
```

### 2. Atualizar cloudflared config

```yaml
# /etc/cloudflared/config.yml
ingress:
  - hostname: play.abitaca.com.br
    service: http://162.12.204.30:80
```

### 3. Deploy para servidor

```bash
cd /Users/gabrielmaia/Documents/projects/bitaca-cinema
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    apps/play-3d/ root@162.12.204.30:/opt/bitaca-cinema/apps/play-3d/
```

### 4. Configurar nginx

```bash
ssh root@162.12.204.30
cp /opt/bitaca-cinema/apps/play-3d/nginx/conf.d/bitaca-play3d.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/bitaca-play3d.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 5. SSL com Certbot

```bash
certbot --nginx -d play.abitaca.com.br
```

## Customização

### Adicionar novo mundo

1. Criar arquivo de cena em `assets/js/scenes/novo-mundo.js`
2. Implementar classe seguindo o padrão:

```javascript
export class NovoMundo {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.objects = [];
    }

    load() {
        // Criar geometrias, luzes, objetos
    }

    update(delta) {
        // Animações frame-a-frame
    }

    unload() {
        // Limpar objetos da cena
    }
}
```

3. Adicionar no `main.js`:

```javascript
import { NovoMundo } from './scenes/novo-mundo.js';

this.worlds = {
    // ...
    novo: new NovoMundo(this.scene, this.camera)
};
```

### Customizar Avatar Derona

Editar `assets/js/components/derona-avatar.js`:

```javascript
// Substituir placeholder por modelo GLTF personalizado
const loader = new GLTFLoader();
const gltf = await loader.loadAsync('assets/models/derona.glb');
this.model = gltf.scene;
```

## Performance

- **FPS Target**: 60 FPS
- **Polygon Budget**: ~100k triangles por cena
- **Texture Limit**: 2K para ambientes, 1K para personagens
- **Draw Calls**: <100 por frame

### Otimizações Implementadas

- ✅ Shadow map size limitado (2048x2048)
- ✅ Frustum culling automático
- ✅ LOD (Level of Detail) para objetos distantes
- ✅ Object pooling para cards de filmes
- ✅ Texture compression (recomendado: KTX2)

## Testes

```bash
# Abrir no navegador
open http://localhost:8000/apps/play-3d/

# Ou com servidor Python
cd apps/play-3d
python3 -m http.server 8000
```

## Recursos

- [Three.js Docs](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Bitaca Backend API](https://api.abitaca.com.br/docs)

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto faz parte do **Bitaca Cinema** - Catálogo de produções audiovisuais de Capão Bonito/SP.

---

**Desenvolvido para a cultura de Capão Bonito**

[Mostra de Cinema](https://abitaca.com.br) | [Galeria Bitaca](https://galeria.abitaca.com.br) | [API](https://api.abitaca.com.br)
