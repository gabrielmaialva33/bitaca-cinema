/**
 * NVIDIA API Client
 * Integration with NVIDIA NIM models
 */

export class NvidiaAPI {
    constructor() {
        this.baseUrl = 'https://integrate.api.nvidia.com/v1';
        this.apiKey = localStorage.getItem('nvidia_api_key') || '';
        this.currentModel = 'meta/llama-3.3-70b-instruct';

        this.models = [
            {
                id: 'meta/llama-3.3-70b-instruct',
                name: 'Llama 3.3 70B',
                provider: 'Meta',
                description: 'Modelo multilíngue avançado com 70B de parâmetros. Excelente para tarefas complexas.',
                contextLength: 128000,
                badge: 'Recomendado'
            },
            {
                id: 'meta/llama-3.1-70b-instruct',
                name: 'Llama 3.1 70B',
                provider: 'Meta',
                description: 'Versão estável do Llama 3.1 com ótimo desempenho geral.',
                contextLength: 128000,
                badge: 'Estável'
            },
            {
                id: 'meta/llama-3.1-8b-instruct',
                name: 'Llama 3.1 8B',
                provider: 'Meta',
                description: 'Modelo compacto e rápido. Ideal para tarefas simples e respostas rápidas.',
                contextLength: 128000,
                badge: 'Rápido'
            },
            {
                id: 'nvidia/llama-3.1-nemotron-70b-instruct',
                name: 'Nemotron 70B',
                provider: 'NVIDIA',
                description: 'Modelo otimizado da NVIDIA baseado no Llama 3.1. Alto desempenho.',
                contextLength: 128000,
                badge: 'NVIDIA'
            },
            {
                id: 'mistralai/mixtral-8x7b-instruct-v0.1',
                name: 'Mixtral 8x7B',
                provider: 'Mistral AI',
                description: 'Modelo Mixture-of-Experts com excelente custo-benefício.',
                contextLength: 32000,
                badge: 'MoE'
            },
            {
                id: 'mistralai/mistral-7b-instruct-v0.3',
                name: 'Mistral 7B v0.3',
                provider: 'Mistral AI',
                description: 'Modelo compacto e eficiente da Mistral AI.',
                contextLength: 32000,
                badge: 'Eficiente'
            },
            {
                id: 'google/gemma-2-27b-it',
                name: 'Gemma 2 27B',
                provider: 'Google',
                description: 'Modelo open-source do Google com bom desempenho.',
                contextLength: 8192,
                badge: 'Google'
            },
            {
                id: 'microsoft/phi-3-medium-128k-instruct',
                name: 'Phi-3 Medium',
                provider: 'Microsoft',
                description: 'Modelo da Microsoft otimizado para contextos longos.',
                contextLength: 128000,
                badge: 'Long Context'
            }
        ];
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('nvidia_api_key', apiKey);
    }

    /**
     * Check if API key is set
     */
    hasApiKey() {
        return this.apiKey && this.apiKey.length > 0;
    }

    /**
     * Set current model
     */
    setModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (model) {
            this.currentModel = modelId;
            return model;
        }
        return null;
    }

    /**
     * Get all available models
     */
    getModels() {
        return this.models;
    }

    /**
     * Get current model info
     */
    getCurrentModel() {
        return this.models.find(m => m.id === this.currentModel);
    }

    /**
     * Send chat completion request
     */
    async chat(messages, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('API key não configurada');
        }

        const {
            temperature = 0.7,
            max_tokens = 1024,
            top_p = 0.9,
            stream = false
        } = options;

        const url = `${this.baseUrl}/chat/completions`;

        const body = {
            model: this.currentModel,
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            top_p: top_p,
            stream: stream
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        try {
            if (stream) {
                return await this.streamChat(url, body, headers);
            } else {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                return {
                    content: data.choices[0].message.content,
                    usage: data.usage,
                    model: data.model
                };
            }
        } catch (error) {
            console.error('NVIDIA API Error:', error);
            throw error;
        }
    }

    /**
     * Stream chat completion
     */
    async streamChat(url, body, headers) {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.body;
    }

    /**
     * Parse SSE stream
     */
    async *parseStream(stream) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(trimmed.slice(6));
                            const content = json.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        } catch (e) {
                            console.warn('Failed to parse SSE:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Test API connection
     */
    async test() {
        try {
            const result = await this.chat([
                { role: 'user', content: 'Hello' }
            ], { max_tokens: 10 });
            return { success: true, message: 'API conectada com sucesso!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

export default NvidiaAPI;
