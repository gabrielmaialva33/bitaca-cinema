# Bitaca Play - Arquitetura com Rust/WASM

## 📋 Visão Geral

Proposta de arquitetura para implementar:
1. **Chat Derona** - Assistente AI funcional
2. **Video Player** - Player de vídeo com Rust/WASM para streaming HLS/DASH

---

## 🎯 Objetivos

### Chat Derona
- Processar mensagens do usuário
- Recomendar animes/filmes baseado em preferências
- Busca inteligente no catálogo
- Integração com API do backend

### Video Player
- Decodificação de vídeo em WASM para performance
- Suporte a HLS (HTTP Live Streaming)
- Suporte a DASH (Dynamic Adaptive Streaming)
- Controles nativos de player
- Buffer adaptativo
- Picture-in-Picture
- Casting para TV

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (Play)                       │
│  ┌────────────────────┐      ┌─────────────────────────┐ │
│  │   Chat Derona      │      │   Video Player (WASM)   │ │
│  │                    │      │                         │ │
│  │  - UI Components   │      │  - Rust Core            │ │
│  │  - WebSocket       │      │  - HLS Parser           │ │
│  │  - Message Queue   │      │  - DASH Parser          │ │
│  └────────┬───────────┘      └───────────┬─────────────┘ │
└───────────┼──────────────────────────────┼───────────────┘
            │                              │
            │ WebSocket/SSE                │ Media Segments
            │                              │
┌───────────▼──────────────────────────────▼───────────────┐
│                   BACKEND (FastAPI/Rust)                  │
│  ┌─────────────────┐      ┌──────────────────────────┐   │
│  │  Chat Service   │      │  Streaming Service       │   │
│  │                 │      │                          │   │
│  │  - NLP/LLM      │      │  - Video Transcoding     │   │
│  │  - Recommendations │   │  - HLS Segmentation      │   │
│  │  - RAG Search   │      │  - DASH Packaging        │   │
│  └─────────────────┘      └──────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes

### 1. Chat Derona (JavaScript + Backend)

#### Frontend (`apps/play/assets/js/chat-derona.js`)

```javascript
class DeronaChat {
    constructor() {
        this.ws = null;
        this.apiUrl = 'https://api.abitaca.com.br';
        this.messageQueue = [];
    }

    async init() {
        // Connect to WebSocket for real-time chat
        this.ws = new WebSocket(`${this.apiUrl}/ws/chat`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }

    async sendMessage(text) {
        // Send message to backend
        const response = await fetch(`${this.apiUrl}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await this.getToken()}`
            },
            body: JSON.stringify({
                message: text,
                context: this.getUserContext()
            })
        });

        return await response.json();
    }

    getUserContext() {
        // Get user preferences and viewing history
        return {
            favoriteGenres: window.onboardingSystem?.userPreferences?.favoriteGenres || [],
            watchedVideos: this.getWatchHistory(),
            currentVideo: window.currentVideo || null
        };
    }
}
```

#### Backend (`apps/backend/services/chat_service.py`)

```python
from fastapi import WebSocket
from langchain.llms import OpenAI
from langchain.chains import ConversationalRetrievalChain

class DeronaService:
    def __init__(self):
        self.llm = OpenAI(temperature=0.7)
        self.vector_store = self.load_catalog_embeddings()

    async def process_message(self, message: str, user_context: dict):
        # Process user message with LLM
        response = await self.llm.agenerate([
            f"User: {message}\nContext: {user_context}\n
Assistant:"
        ])

        # Search recommendations
        recommendations = await self.search_recommendations(
            message,
            user_context
        )

        return {
            "text": response.generations[0][0].text,
            "recommendations": recommendations
        }
```

### 2. Video Player com Rust/WASM

#### Estrutura do Projeto

```
bitaca-player-wasm/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Entry point WASM
│   ├── player.rs           # Player core
│   ├── hls/
│   │   ├── parser.rs       # HLS manifest parser
│   │   └── downloader.rs   # Segment downloader
│   ├── dash/
│   │   ├── parser.rs       # DASH MPD parser
│   │   └── adaptive.rs     # Adaptive bitrate logic
│   └── codec/
│       ├── decoder.rs      # Video decoder
│       └── renderer.rs     # WebGL renderer
└── www/
    └── index.js            # JavaScript bindings
```

#### Core Player (`src/player.rs`)

```rust
use wasm_bindgen::prelude::*;
use web_sys::{HtmlVideoElement, MediaSource};

#[wasm_bindgen]
pub struct BitacaPlayer {
    video_element: HtmlVideoElement,
    media_source: MediaSource,
    current_quality: u32,
    buffer_size: f64,
}

#[wasm_bindgen]
impl BitacaPlayer {
    #[wasm_bindgen(constructor)]
    pub fn new(video_id: &str) -> Result<BitacaPlayer, JsValue> {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();

        let video_element = document
            .get_element_by_id(video_id)
            .unwrap()
            .dyn_into::<HtmlVideoElement>()?;

        let media_source = MediaSource::new()?;

        Ok(BitacaPlayer {
            video_element,
            media_source,
            current_quality: 720,
            buffer_size: 30.0,
        })
    }

    #[wasm_bindgen]
    pub async fn load_stream(&mut self, url: &str) -> Result<(), JsValue> {
        // Parse HLS/DASH manifest
        if url.ends_with(".m3u8") {
            self.load_hls(url).await?;
        } else if url.ends_with(".mpd") {
            self.load_dash(url).await?;
        }
        Ok(())
    }

    async fn load_hls(&mut self, url: &str) -> Result<(), JsValue> {
        // Implementation...
        Ok(())
    }
}
```

#### HLS Parser (`src/hls/parser.rs`)

```rust
use std::collections::HashMap;

pub struct HLSManifest {
    pub version: u32,
    pub target_duration: u32,
    pub media_sequence: u32,
    pub segments: Vec<Segment>,
    pub variants: Vec<Variant>,
}

pub struct Variant {
    pub bandwidth: u32,
    pub resolution: (u32, u32),
    pub codecs: String,
    pub url: String,
}

pub struct Segment {
    pub duration: f64,
    pub url: String,
}

impl HLSManifest {
    pub fn parse(content: &str) -> Result<Self, String> {
        let mut manifest = HLSManifest::default();

        for line in content.lines() {
            if line.starts_with("#EXT-X-VERSION:") {
                manifest.version = line[15..].parse().unwrap();
            }
            // ... parse other tags
        }

        Ok(manifest)
    }
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Chat Derona (1-2 semanas)

1. **Backend Chat Service**
   - [ ] Criar endpoint `/api/chat/message`
   - [ ] Implementar WebSocket para real-time
   - [ ] Integrar com LLM (OpenAI/Anthropic)
   - [ ] Criar sistema de busca com RAG

2. **Frontend Chat Integration**
   - [ ] Criar `chat-derona.js`
   - [ ] Implementar envio de mensagens
   - [ ] Adicionar typing indicator
   - [ ] Renderizar recomendações

3. **Testing**
   - [ ] Testes unitários do backend
   - [ ] Testes E2E com Playwright
   - [ ] Load testing do WebSocket

### Fase 2: Video Player WASM (3-4 semanas)

1. **Setup Rust/WASM Project**
   - [ ] Criar workspace `bitaca-player-wasm`
   - [ ] Configurar wasm-pack
   - [ ] Setup CI/CD para build WASM

2. **Core Player Implementation**
   - [ ] Player core com MediaSource API
   - [ ] Buffer management
   - [ ] Quality selection UI

3. **HLS Support**
   - [ ] Parser de manifesto HLS
   - [ ] Segment downloader
   - [ ] Adaptive bitrate logic

4. **DASH Support** (Opcional)
   - [ ] Parser MPD
   - [ ] Multi-period support

5. **Integration**
   - [ ] JavaScript bindings
   - [ ] Replace current player
   - [ ] Update UI components

---

## 📊 Performance Esperada

### Video Player WASM vs JavaScript

| Métrica | JavaScript | Rust/WASM | Melhoria |
|---------|-----------|-----------|----------|
| Parse HLS | ~50ms | ~5ms | **10x** |
| Segment Load | ~100ms | ~30ms | **3x** |
| Memory | ~50MB | ~20MB | **60%** |
| Bundle Size | 200KB | 300KB | -50KB |

### Chat Derona

- **Response Time**: < 1s (com cache)
- **WebSocket Latency**: < 100ms
- **Concurrent Users**: 1000+ por instância

---

## 🔐 Segurança

### Chat
- Rate limiting (10 msg/min por usuário)
- Content moderation com AI
- Encryption end-to-end para mensagens sensíveis

### Video Player
- DRM suporte (Widevine/FairPlay)
- Token-based auth para segments
- CORS policies adequadas

---

## 📦 Dependências

### Rust/WASM
```toml
[dependencies]
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = ["HtmlVideoElement", "MediaSource"] }
js-sys = "0.3"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.11", features = ["json"] }
```

### Python Backend
```toml
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
langchain = "^0.0.350"
openai = "^1.3.0"
websockets = "^12.0"
```

---

## 🧪 Testes

### Chat E2E
```javascript
// tests/e2e/chat-derona.spec.js
test('should send message and receive response', async ({ page }) => {
    await page.goto('https://play.abitaca.com.br/');

    // Type message
    await page.fill('#chat-input', 'Mostre animes de ação');
    await page.click('#send-btn');

    // Wait for response
    await page.waitForSelector('.bot-message', { timeout: 5000 });

    // Check recommendations
    const recommendations = await page.locator('.recommendation-card').count();
    expect(recommendations).toBeGreaterThan(0);
});
```

### Player WASM Test
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hls_parser() {
        let manifest = r#"
        #EXTM3U
        #EXT-X-VERSION:3
        #EXT-X-TARGETDURATION:10
        "#;

        let result = HLSManifest::parse(manifest);
        assert!(result.is_ok());
    }
}
```

---

## 🎯 Next Steps

1. ✅ Criar proposta de arquitetura
2. ⏳ Review e aprovação da arquitetura
3. ⏳ Implementar Chat Derona backend
4. ⏳ Implementar Chat Derona frontend
5. ⏳ Setup projeto Rust/WASM
6. ⏳ Implementar core do player
7. ⏳ Deploy e testes

---

## 📚 Referências

- [Smelter - Rust WebAssembly Video Streaming](https://github.com/software-mansion/smelter)
- [FFmpeg.wasm - Video Processing in Browser](https://ffmpegwasm.netlify.app/)
- [rx-player - DASH Player with WASM](https://github.com/canalplus/rx-player)
- [HLS.js - JavaScript HLS Player](https://github.com/video-dev/hls.js)
- [Media Source Extensions API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API)
