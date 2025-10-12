// ===============================================
// BITACA CINEMA - STREAMING HANDLER
// Gerencia streaming de respostas da NVIDIA API
// ===============================================

/**
 * Streaming Handler Class
 * Processa respostas streaming da NVIDIA NIM API
 */
class StreamingHandler {
    constructor(apiKey) {
        this.apiKey = apiKey; // Não é mais necessário, backend tem a key
        // Auto-detect environment
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.baseURL = isLocalhost
            ? 'http://localhost:3000/api'
            : 'https://api.abitaca.com.br/api';
        this.defaultModel = 'meta/llama-3.3-70b-instruct'; // Modelo padrão
        console.log(`StreamingHandler initialized with baseURL: ${this.baseURL}`);
    }

    /**
     * Faz streaming de resposta da API
     * @param {Array} messages - Array de mensagens do chat
     * @param {Object} modelConfig - Configuração do modelo (model, temperature, max_tokens) ou opções antigas
     * @returns {AsyncGenerator<string>} - Generator que emite tokens
     */
    async* streamResponse(messages, modelConfig = {}) {
        // Suporta tanto modelConfig do router quanto options antigas
        const {
            model = modelConfig.model || this.defaultModel,
            temperature = modelConfig.temperature || 0.7,
            max_tokens = modelConfig.max_tokens || 500,
            top_p = 0.9
        } = modelConfig;

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: max_tokens,
                    top_p: top_p,
                    stream: true // STREAMING ATIVADO
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const {done, value} = await reader.read();

                if (done) break;

                // Decodifica chunk
                buffer += decoder.decode(value, {stream: true});

                // Processa linhas do buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Guarda linha incompleta

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
                        continue;
                    }

                    const data = trimmedLine.slice(6); // Remove "data: "

                    if (data === '[DONE]') {
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;

                        if (content) {
                            yield content; // Emite token
                        }
                    } catch (e) {
                        console.warn('Error parsing SSE chunk:', e);
                        // Continua processando outros chunks
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            throw new Error('Falha ao processar resposta streaming: ' + error.message);
        }
    }

    /**
     * Faz requisição não-streaming (para casos específicos)
     * @param {Array} messages - Array de mensagens
     * @param {Object} modelConfig - Configuração do modelo ou opções
     * @returns {Promise<string>} - Resposta completa
     */
    async generateResponse(messages, modelConfig = {}) {
        const {
            model = modelConfig.model || this.defaultModel,
            temperature = modelConfig.temperature || 0.7,
            max_tokens = modelConfig.max_tokens || 500
        } = modelConfig;

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: max_tokens,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Generation error:', error);
            throw error;
        }
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamingHandler;
}
