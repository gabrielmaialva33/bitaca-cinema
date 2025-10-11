// ===============================================
// BITACA CINEMA - INTENT DETECTOR
// Detecta a intenção do usuário (busca, recomendação, info, chat)
// ===============================================

/**
 * Intent Detector Class
 * Classifica a intenção do usuário baseado em keywords e padrões
 */
class IntentDetector {
  constructor(apiKey) {
    this.apiKey = apiKey;

    // Keywords para cada tipo de intenção
    this.intents = {
      SEARCH: {
        keywords: ['buscar', 'procurar', 'encontrar', 'ver', 'mostrar', 'quais', 'tem', 'existe', 'listar', 'filme', 'produção'],
        confidence: 0.9
      },
      RECOMMEND: {
        keywords: ['recomendar', 'sugerir', 'indicar', 'parecido', 'similar', 'tipo', 'estilo', 'gosto', 'interessante'],
        confidence: 0.85
      },
      INFO: {
        keywords: ['lei', 'fomento', 'paulo gustavo', 'aldir blanc', 'pnab', 'onde', 'quando', 'como', 'o que é', 'explica', 'bitaca'],
        confidence: 0.8
      },
      CHAT: {
        keywords: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'obrigado', 'valeu'],
        confidence: 0.7
      }
    };
  }

  /**
   * Detecta a intenção da mensagem do usuário
   * @param {string} userMessage - Mensagem do usuário
   * @returns {Promise<Object>} - { intent: string, confidence: number }
   */
  async detectIntent(userMessage) {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Verifica cada intenção
    for (const [intentName, intentData] of Object.entries(this.intents)) {
      const hasKeyword = intentData.keywords.some(keyword =>
        lowerMessage.includes(keyword)
      );

      if (hasKeyword) {
        return {
          intent: intentName,
          confidence: intentData.confidence
        };
      }
    }

    // Se não detectou nenhuma intenção específica, assume CHAT
    return {
      intent: 'CHAT',
      confidence: 0.6
    };
  }

  /**
   * Valida se a mensagem requer busca RAG
   * @param {string} intent - Intenção detectada
   * @returns {boolean}
   */
  requiresRAG(intent) {
    return intent === 'SEARCH' || intent === 'RECOMMEND';
  }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntentDetector;
}
