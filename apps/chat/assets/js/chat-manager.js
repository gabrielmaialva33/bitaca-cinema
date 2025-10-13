/**
 * Chat Manager
 * Manages chat state, messages, and UI interactions
 */

export class ChatManager {
    constructor(nvidiaAPI, firebaseChat) {
        this.api = nvidiaAPI;
        this.firebase = firebaseChat;
        this.currentConversation = null;
        this.conversations = [];
        this.isStreaming = false;

        // Settings
        this.settings = {
            temperature: parseFloat(localStorage.getItem('chat_temperature') || '0.7'),
            maxTokens: parseInt(localStorage.getItem('chat_max_tokens') || '1024'),
            soundEnabled: localStorage.getItem('chat_sound') !== 'false'
        };
    }

    /**
     * Initialize chat manager
     */
    async initialize() {
        // Wait for authentication
        await this.firebase.waitForAuth();

        // Load or create current session
        this.currentConversation = await this.firebase.getCurrentSession();

        // Load conversations list
        await this.loadConversations();

        // Listen to real-time updates
        this.firebase.listenToConversations((conversations) => {
            this.conversations = conversations.filter(c => !c.deleted);
        });
    }

    /**
     * Load conversations from Firestore
     */
    async loadConversations() {
        try {
            this.conversations = await this.firebase.getConversations();
            this.conversations = this.conversations.filter(c => !c.deleted);
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversations = [];
        }
    }

    /**
     * Create new conversation
     */
    async newConversation() {
        const newId = this.firebase.generateId();

        this.currentConversation = {
            id: newId,
            title: 'Nova Conversa',
            messages: [],
            model: this.api.currentModel,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.firebase.setCurrentSession(newId);

        return this.currentConversation;
    }

    /**
     * Switch to conversation
     */
    async switchConversation(conversationId) {
        const conversation = await this.firebase.getConversation(conversationId);

        if (conversation) {
            this.currentConversation = conversation;
            this.firebase.setCurrentSession(conversationId);

            // Update model if different
            if (conversation.model && conversation.model !== this.api.currentModel) {
                this.api.setModel(conversation.model);
            }

            return conversation;
        }

        return null;
    }

    /**
     * Send message
     */
    async sendMessage(content, onChunk = null) {
        if (!content || content.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        this.currentConversation.messages.push(userMessage);

        // Prepare messages for API
        const apiMessages = this.currentConversation.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            let assistantContent = '';

            if (onChunk) {
                // Streaming mode
                this.isStreaming = true;

                const stream = await this.api.chat(apiMessages, {
                    temperature: this.settings.temperature,
                    max_tokens: this.settings.maxTokens,
                    stream: true
                });

                for await (const chunk of this.api.parseStream(stream)) {
                    assistantContent += chunk;
                    onChunk(chunk);
                }

                this.isStreaming = false;
            } else {
                // Non-streaming mode
                const response = await this.api.chat(apiMessages, {
                    temperature: this.settings.temperature,
                    max_tokens: this.settings.maxTokens,
                    stream: false
                });

                assistantContent = response.content;
            }

            // Add assistant message
            const assistantMessage = {
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date()
            };

            this.currentConversation.messages.push(assistantMessage);

            // Generate title from first message if needed
            if (this.currentConversation.messages.length === 2 &&
                this.currentConversation.title === 'Nova Conversa') {
                this.currentConversation.title = this.firebase.generateTitle(userMessage);
            }

            // Save to Firestore
            await this.saveCurrentConversation();

            return assistantMessage;

        } catch (error) {
            this.isStreaming = false;
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Save current conversation
     */
    async saveCurrentConversation() {
        if (!this.currentConversation) return;

        try {
            await this.firebase.saveConversation(
                this.currentConversation.id,
                {
                    title: this.currentConversation.title,
                    messages: this.currentConversation.messages,
                    model: this.currentConversation.model || this.api.currentModel,
                    createdAt: this.currentConversation.createdAt,
                    deleted: false
                }
            );
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }

    /**
     * Delete conversation
     */
    async deleteConversation(conversationId) {
        try {
            await this.firebase.deleteConversation(conversationId);

            // If deleting current conversation, create new one
            if (this.currentConversation && this.currentConversation.id === conversationId) {
                await this.newConversation();
            }

            // Reload conversations
            await this.loadConversations();

            return { success: true };
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Get current conversation
     */
    getCurrentConversation() {
        return this.currentConversation;
    }

    /**
     * Get conversations list
     */
    getConversations() {
        return this.conversations;
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        if (settings.temperature !== undefined) {
            this.settings.temperature = settings.temperature;
            localStorage.setItem('chat_temperature', settings.temperature);
        }

        if (settings.maxTokens !== undefined) {
            this.settings.maxTokens = settings.maxTokens;
            localStorage.setItem('chat_max_tokens', settings.maxTokens);
        }

        if (settings.soundEnabled !== undefined) {
            this.settings.soundEnabled = settings.soundEnabled;
            localStorage.setItem('chat_sound', settings.soundEnabled);
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Change model
     */
    changeModel(modelId) {
        const model = this.api.setModel(modelId);

        if (model && this.currentConversation) {
            this.currentConversation.model = modelId;
            this.saveCurrentConversation();
        }

        return model;
    }

    /**
     * Cancel streaming
     */
    cancelStreaming() {
        this.isStreaming = false;
    }

    /**
     * Format message for display
     */
    formatMessage(content) {
        // Convert markdown-like syntax to HTML
        let formatted = content;

        // Code blocks
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
        });

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Agora';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min atrás`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h atrás`;
        }

        // Format as date
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }
}

export default ChatManager;
