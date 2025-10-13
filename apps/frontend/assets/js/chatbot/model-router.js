// ===============================================
// BITACA CINEMA - MODEL ROUTER
// Seleciona o melhor modelo NVIDIA NIM baseado em intenção e complexidade
// ===============================================

/**
 * Model Router Class
 * Escolhe o modelo de IA ideal para cada query
 */
class ModelRouter {
    constructor() {
        // Catálogo de modelos NVIDIA NIM disponíveis
        this.models = {
            // Fast models - Para queries simples e chat casual
            FAST: {
                id: 'meta/llama-3.1-8b-instruct',
                description: 'Modelo rápido para chat casual',
                max_tokens: 500,
                temperature: 0.8,
                use_cases: ['CHAT', 'simple_greetings']
            },

            // Medium models - Para buscas e recomendações
            MEDIUM: {
                id: 'meta/llama-3.3-70b-instruct',
                description: 'Modelo balanceado para buscas',
                max_tokens: 800,
                temperature: 0.7,
                use_cases: ['SEARCH', 'RECOMMEND']
            },

            // Reasoning models - Para análises complexas
            REASONING: {
                id: 'qwen/qwen3-next-80b-a3b-thinking',
                description: 'Modelo de raciocínio avançado',
                max_tokens: 1000,
                temperature: 0.6,
                use_cases: ['complex_analysis', 'INFO']
            },

            // Alternative reasoning
            DEEPSEEK: {
                id: 'deepseek-ai/deepseek-r1',
                description: 'Modelo de raciocínio profundo',
                max_tokens: 1200,
                temperature: 0.5,
                use_cases: ['complex_reasoning', 'philosophical']
            },

            // Specialized models
            CODE: {
                id: 'mistralai/codestral-22b-instruct-v0.1',
                description: 'Especializado em código',
                max_tokens: 1000,
                temperature: 0.3,
                use_cases: ['code', 'technical']
            }
        };

        // Palavras-chave para detecção de complexidade
        this.complexityIndicators = {
            HIGH: [
                'explica', 'detalhe', 'como funciona', 'por que', 'análise',
                'diferença', 'comparar', 'aprofundar', 'entender melhor',
                'técnico', 'específico', 'complexo'
            ],
            TECHNICAL: [
                'código', 'api', 'implementar', 'desenvolver', 'programar',
                'algoritmo', 'função', 'script', 'backend', 'frontend'
            ],
            PHILOSOPHICAL: [
                'significado', 'importância', 'essência', 'propósito',
                'contexto histórico', 'impacto cultural', 'reflexão'
            ]
        };
    }

    /**
     * Detecta complexidade da query
     * @param {string} userMessage - Mensagem do usuário
     * @returns {string} - 'simple', 'medium', 'high', 'technical', 'philosophical'
     */
    detectComplexity(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Technical queries
        if (this.complexityIndicators.TECHNICAL.some(kw => lowerMessage.includes(kw))) {
            return 'technical';
        }

        // Philosophical/deep queries
        if (this.complexityIndicators.PHILOSOPHICAL.some(kw => lowerMessage.includes(kw))) {
            return 'philosophical';
        }

        // High complexity
        if (this.complexityIndicators.HIGH.some(kw => lowerMessage.includes(kw))) {
            return 'high';
        }

        // Check message length and structure
        const wordCount = userMessage.split(/\s+/).length;
        const hasQuestions = (userMessage.match(/\?/g) || []).length;

        if (wordCount > 20 || hasQuestions > 1) {
            return 'medium';
        }

        return 'simple';
    }

    /**
     * Seleciona o melhor modelo baseado em intenção e complexidade
     * @param {string} intent - Intenção detectada (SEARCH, RECOMMEND, INFO, CHAT)
     * @param {string} complexity - Complexidade da query
     * @returns {Object} - { model, temperature, max_tokens, description }
     */
    selectModel(intent, complexity) {
        console.log(`🧠 Model Router: intent=${intent}, complexity=${complexity}`);

        // Technical queries -> Code model
        if (complexity === 'technical') {
            return this.getModelConfig('CODE');
        }

        // Philosophical/deep analysis -> DeepSeek R1
        if (complexity === 'philosophical') {
            return this.getModelConfig('DEEPSEEK');
        }

        // Route by intent + complexity
        switch (intent) {
            case 'CHAT':
                // Simple chat -> Fast model
                if (complexity === 'simple') {
                    return this.getModelConfig('FAST');
                }
                // Complex chat -> Reasoning model
                return this.getModelConfig('REASONING');

            case 'SEARCH':
                // All searches use medium model (fast + accurate)
                return this.getModelConfig('MEDIUM');

            case 'RECOMMEND':
                // Recommendations use medium model
                return this.getModelConfig('MEDIUM');

            case 'INFO':
                // Info queries are usually complex
                if (complexity === 'high' || complexity === 'medium') {
                    return this.getModelConfig('REASONING');
                }
                return this.getModelConfig('MEDIUM');

            default:
                // Fallback to medium model
                return this.getModelConfig('MEDIUM');
        }
    }

    /**
     * Retorna configuração completa do modelo
     * @param {string} modelKey - Chave do modelo (FAST, MEDIUM, etc)
     * @returns {Object} - Configuração do modelo
     */
    getModelConfig(modelKey) {
        const config = this.models[modelKey];
        return {
            model: config.id,
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            description: config.description
        };
    }

    /**
     * Retorna estatísticas de uso dos modelos
     * @returns {Object} - Estatísticas
     */
    getStats() {
        return {
            available_models: Object.keys(this.models).length,
            models: Object.entries(this.models).map(([key, config]) => ({
                key,
                id: config.id,
                description: config.description
            }))
        };
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelRouter;
}
