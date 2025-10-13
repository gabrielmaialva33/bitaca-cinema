// ===============================================
// BITACA CINEMA - AI CHATBOT (Main Controller)
// Orquestra todos os componentes do chatbot
// ===============================================

/**
 * Bitaca AI Chatbot Class
 * Controlador principal que integra RAG, streaming, detecção de intenção e multi-modelo
 */
class BitacaAIChatbot {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Limite de mensagens na memória

        // Componentes
        this.intentDetector = new IntentDetector(apiKey);
        this.modelRouter = new ModelRouter(); // Router multi-modelo
        this.streamingHandler = new StreamingHandler(apiKey);
        this.ragSearch = null; // Será inicializado após carregar embeddings

        // Contexto do projeto
        this.context = {
            site: "Bitaca Cinema",
            location: "Capão Bonito/SP",
            producoes: window.filmesData || [],
            leis: ["Lei Paulo Gustavo (LC nº 195/2022)", "PNAB - Política Nacional Aldir Blanc (Lei nº 14.399/2022)"],
            espaco: "Galeria Bitaca Café Bar",
            ethos: "Underground, Visceral, Democrático"
        };

        this.isInitialized = false;
    }

    /**
     * Inicializa o chatbot (carrega embeddings)
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('🤖 Initializing Bitaca AI Chatbot...');

            // Tenta carregar embeddings do arquivo JSON
            const response = await fetch('/assets/data/embeddings.json');

            if (!response.ok) {
                console.warn('⚠️ Embeddings file not found. RAG disabled. Run rag-setup.js to generate embeddings.');
                this.ragSearch = new VectorSearch([]); // RAG vazio
            } else {
                const embeddings = await response.json();
                this.ragSearch = new VectorSearch(embeddings);
                console.log(`✅ RAG initialized with ${embeddings.length} embeddings`);
            }

            this.isInitialized = true;
            console.log('✅ Bitaca AI Chatbot ready!');

        } catch (error) {
            console.error('❌ Initialization error:', error);
            // Continua sem RAG
            this.ragSearch = new VectorSearch([]);
            this.isInitialized = true;
        }
    }

    /**
     * Envia mensagem e processa resposta com streaming
     * @param {string} userMessage - Mensagem do usuário
     * @param {Function} onToken - Callback chamado para cada token (token, fullText)
     * @param {Function} onComplete - Callback chamado ao finalizar (finalResponse, productions)
     * @returns {Promise<void>}
     */
    async sendMessage(userMessage, onToken, onComplete) {
        if (!this.isInitialized) {
            throw new Error('Chatbot not initialized. Call initialize() first.');
        }

        try {
            // 1. DETECTAR INTENÇÃO
            const {intent, confidence} = await this.intentDetector.detectIntent(userMessage);
            console.log(`📍 Intent detected: ${intent} (confidence: ${confidence})`);

            // 2. DETECTAR COMPLEXIDADE E SELECIONAR MODELO
            const complexity = this.modelRouter.detectComplexity(userMessage);
            const modelConfig = this.modelRouter.selectModel(intent, complexity);
            console.log(`🎯 Selected Model: ${modelConfig.model} (${modelConfig.description})`);

            // 3. RAG: BUSCAR PRODUÇÕES RELEVANTES (se necessário)
            let relevantProductions = [];

            if (this.intentDetector.requiresRAG(intent) && this.ragSearch.embeddings.length > 0) {
                console.log('🔍 Performing RAG search...');

                // Gerar embedding da query
                const queryEmbedding = await this.generateQueryEmbedding(userMessage);

                // Busca híbrida (vetorial + keywords)
                relevantProductions = this.ragSearch.hybridSearch(queryEmbedding, userMessage, 3);

                console.log(`✅ Found ${relevantProductions.length} relevant productions`);
            }

            // 4. CONSTRUIR PROMPT COM CONTEXTO
            const systemPrompt = this.buildSystemPrompt(intent, relevantProductions, userMessage);

            // 5. ADICIONAR MENSAGEM DO USUÁRIO À HISTÓRIA
            this.conversationHistory.push({
                role: "user",
                content: userMessage
            });

            // Limitar histórico
            this.trimHistory();

            // 6. PREPARAR MENSAGENS PARA API
            const messages = [
                {role: "system", content: systemPrompt},
                ...this.conversationHistory
            ];

            // 7. STREAMING DA RESPOSTA COM MODELO SELECIONADO
            let fullResponse = '';

            for await (const token of this.streamingHandler.streamResponse(messages, modelConfig)) {
                fullResponse += token;

                // Callback para atualizar UI em tempo real
                if (onToken) {
                    onToken(token, fullResponse);
                }
            }

            // 8. ADICIONAR RESPOSTA À HISTÓRIA
            this.conversationHistory.push({
                role: "assistant",
                content: fullResponse
            });

            // 9. CALLBACK DE CONCLUSÃO
            if (onComplete) {
                onComplete(fullResponse, relevantProductions);
            }

        } catch (error) {
            console.error('❌ Chatbot error:', error);
            throw error;
        }
    }

    /**
     * Constrói o prompt do sistema com contexto dinâmico
     * @param {string} intent - Intenção detectada
     * @param {Array} productions - Produções relevantes do RAG
     * @param {string} userMessage - Mensagem original do usuário
     * @returns {string} - System prompt
     */
    buildSystemPrompt(intent, productions, userMessage) {
        let prompt = `Você é o assistente virtual do **Bitaca Cinema** em Capão Bonito/SP.

**Sua Personalidade:**
- Amigável, acolhedor e apaixonado por cinema e cultura 🎬
- Tom conversacional, autêntico e underground
- Use emojis ocasionalmente (🎥 🍿 🎞️ 🎭 🎵 🏛️ 🌿)
- Respostas concisas (2-3 parágrafos)
- Focado em ajudar o visitante

**Contexto do Bitaca:**
- Local: ${this.context.espaco}
- Cidade: ${this.context.location}
- Total de produções: ${this.context.producoes.length}
- Leis de fomento: ${this.context.leis.join(' e ')}
- Ethos: ${this.context.ethos}

**Eixos Temáticos:**
- 🏛️ Patrimônio & Memória (9 produções)
- 🎵 Cultura Musical (8 produções)
- 🌿 Meio Ambiente & Urbano (7 produções)
`;

        // Adiciona produções relevantes se houver
        if (productions.length > 0) {
            prompt += `\n**🎬 Produções Relevantes para esta conversa:**\n`;
            productions.forEach((prod, i) => {
                prompt += `
${i + 1}. **${prod.titulo}**
   - Diretor: ${prod.metadata.diretor}
   - Tema: ${prod.metadata.tema}
   - Sinopse: ${prod.metadata.sinopse}
   - Similaridade: ${(prod.similarity * 100).toFixed(0)}%
`;
            });
        }

        // Adapta instruções por intenção
        switch (intent) {
            case 'SEARCH':
                prompt += `\n**🔍 Sua Tarefa**: Ajudar o usuário a encontrar produções específicas. ${productions.length > 0 ? 'Use as produções relevantes acima para responder.' : 'Se não encontrar produções relevantes, sugira explorar o catálogo completo no site.'}`;
                break;

            case 'RECOMMEND':
                prompt += `\n**💡 Sua Tarefa**: Recomendar produções baseado nas preferências do usuário. ${productions.length > 0 ? 'Destaque as produções relevantes acima e explique por que são boas escolhas.' : 'Sugira explorar os diferentes eixos temáticos.'}`;
                break;

            case 'INFO':
                prompt += `\n**📚 Sua Tarefa**: Explicar sobre as leis de fomento cultural (Lei Paulo Gustavo e PNAB), o espaço Bitaca, ou informações gerais sobre o projeto. Seja educativo mas acessível.`;
                break;

            default:
                prompt += `\n**💬 Sua Tarefa**: Conversar naturalmente e ajudar no que for necessário. Seja prestativo e amigável.`;
        }

        prompt += `\n\n**Importante**:
- Nunca invente informações sobre produções que não existem
- Se não souber algo, seja honesto
- Sempre incentive o visitante a explorar mais no site
- Mencione o Bitaca Café Bar como espaço cultural físico`;

        return prompt;
    }

    /**
     * Gera embedding de uma query usando backend API
     * @param {string} query - Texto da query
     * @returns {Promise<Array<number>>} - Embedding
     */
    async generateQueryEmbedding(query) {
        try {
            // Use o mesmo baseURL do streaming handler
            const baseURL = this.streamingHandler.baseURL;

            const response = await fetch(`${baseURL}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'nvidia/nv-embedqa-e5-v5',
                    input: query,
                    input_type: "query",
                    encoding_format: "float"
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            console.error('Query embedding error:', error);
            throw error;
        }
    }

    /**
     * Limita o histórico de conversação
     */
    trimHistory() {
        if (this.conversationHistory.length > this.maxHistoryLength) {
            // Mantém apenas as últimas N mensagens
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
            console.log(`📝 History trimmed to ${this.maxHistoryLength} messages`);
        }
    }

    /**
     * Limpa o histórico de conversação
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('🗑️ Conversation history cleared');
    }

    /**
     * Retorna estatísticas do chatbot
     * @returns {Object}
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            historyLength: this.conversationHistory.length,
            maxHistory: this.maxHistoryLength,
            ragEnabled: this.ragSearch?.embeddings?.length > 0,
            embeddings: this.ragSearch?.embeddings?.length || 0,
            producoes: this.context.producoes.length
        };
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitacaAIChatbot;
}
