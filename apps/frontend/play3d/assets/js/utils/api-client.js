/**
 * ========================================
 * API CLIENT - Bitaca Backend Integration
 * Connects to existing FastAPI backend
 * ========================================
 */

class BitacaAPIClient {
    constructor() {
        // Use production or local API
        this.baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : 'https://api.abitaca.com.br/api';

        this.endpoints = {
            chat: '/chat',
            productions: '/productions',
            recommendations: '/recommend',
            search: '/search',
            tts: '/tts'
        };
    }

    /**
     * Send message to Bitaca AI
     * @param {string} message - User message
     * @param {string} sessionId - Session ID for context
     * @returns {Promise<Object>} AI response
     */
    async chat(message, sessionId = null) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    session_id: sessionId,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Chat API error:', error);
            return {
                response: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
                agent: 'error'
            };
        }
    }

    /**
     * Stream chat response (for real-time updates)
     * @param {string} message - User message
     * @param {Function} onChunk - Callback for each chunk
     * @param {string} sessionId - Session ID
     */
    async chatStream(message, onChunk, sessionId = null) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    session_id: sessionId,
                    stream: true
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        onChunk(data);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Stream chat error:', error);
        }
    }

    /**
     * Get all productions
     * @returns {Promise<Array>} List of productions
     */
    async getProductions() {
        try {
            // For now, use local data
            // In production, fetch from backend
            const response = await fetch('/frontend/assets/js/data.js');
            // Parse and return data
            return [];
        } catch (error) {
            console.error('❌ Get productions error:', error);
            return [];
        }
    }

    /**
     * Get production recommendations based on user preferences
     * @param {Object} preferences - User preferences
     * @returns {Promise<Array>} Recommended productions
     */
    async getRecommendations(preferences = {}) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.recommendations}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });

            return await response.json();
        } catch (error) {
            console.error('❌ Recommendations error:', error);
            return [];
        }
    }

    /**
     * Semantic search for productions
     * @param {string} query - Search query
     * @returns {Promise<Array>} Search results
     */
    async search(query) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.search}?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('❌ Search error:', error);
            return [];
        }
    }

    /**
     * Text-to-Speech (Derona voice)
     * @param {string} text - Text to convert
     * @returns {Promise<Blob>} Audio blob
     */
    async textToSpeech(text) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.tts}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    voice: 'derona'
                })
            });

            return await response.blob();
        } catch (error) {
            console.error('❌ TTS error:', error);
            return null;
        }
    }
}

// Export singleton instance
const apiClient = new BitacaAPIClient();
window.bitacaAPI = apiClient;
