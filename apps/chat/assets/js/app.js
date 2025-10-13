/**
 * Bitaca AI Chat - Main Application
 */

import NvidiaAPI from './nvidia-api.js';
import FirebaseChat from './firebase-chat.js';
import ChatManager from './chat-manager.js';

class BitacaChat {
    constructor() {
        // Initialize services
        this.nvidia = new NvidiaAPI();
        this.firebase = new FirebaseChat();
        this.chat = new ChatManager(this.nvidia, this.firebase);

        // UI Elements
        this.elements = {
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            welcomeScreen: document.getElementById('welcome-screen'),
            conversationsList: document.getElementById('conversations-list'),
            currentModelName: document.getElementById('current-model-name'),
            newChatBtn: document.getElementById('new-chat-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            modelModal: document.getElementById('model-modal'),
            settingsModal: document.getElementById('settings-modal'),
            modelSelectorBtn: document.getElementById('model-selector-btn'),
            changeModelBtn: document.getElementById('change-model-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            modelsGrid: document.getElementById('models-grid'),
            loadingOverlay: document.getElementById('loading-overlay'),
            charCount: document.getElementById('char-count'),
            temperatureSlider: document.getElementById('temperature-slider'),
            temperatureValue: document.getElementById('temperature-value'),
            maxTokensSlider: document.getElementById('max-tokens-slider'),
            maxTokensValue: document.getElementById('max-tokens-value'),
            apiKeyInput: document.getElementById('api-key-input'),
            saveApiKeyBtn: document.getElementById('save-api-key-btn')
        };

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Bitaca AI Chat - Initializing...');

        // Show loading
        this.showLoading();

        try {
            // Wait for Firebase auth
            const user = await this.firebase.waitForAuth();

            if (!user) {
                return; // Will redirect to login
            }

            // Initialize chat manager
            await this.chat.initialize();

            // Setup UI
            this.setupEventListeners();
            this.loadModels();
            this.loadSettings();
            this.renderConversations();
            this.renderCurrentConversation();

            // Check API key
            if (!this.nvidia.hasApiKey()) {
                this.showSettings();
            }

            console.log('✅ Bitaca AI Chat - Ready!');
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Erro ao inicializar aplicação: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());

        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateCharCount();
            this.updateSendButton();
        });

        // New conversation
        this.elements.newChatBtn.addEventListener('click', () => this.handleNewChat());

        // Logout
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Modals
        this.elements.modelSelectorBtn.addEventListener('click', () => this.showModelSelector());
        this.elements.changeModelBtn.addEventListener('click', () => this.showModelSelector());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());

        // Close modals
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.btn-close').dataset.modal;
                this.closeModal(modalId);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Quick prompts
        document.querySelectorAll('.quick-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                this.elements.messageInput.value = prompt;
                this.autoResizeTextarea();
                this.updateSendButton();
                this.elements.messageInput.focus();
            });
        });

        // Settings
        this.elements.temperatureSlider.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
            this.chat.updateSettings({ temperature: parseFloat(e.target.value) });
        });

        this.elements.maxTokensSlider.addEventListener('input', (e) => {
            this.elements.maxTokensValue.textContent = e.target.value;
            this.chat.updateSettings({ maxTokens: parseInt(e.target.value) });
        });

        this.elements.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());

        // Enter key in API key input
        this.elements.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const content = this.elements.messageInput.value.trim();

        if (!content || this.chat.isStreaming) return;

        if (!this.nvidia.hasApiKey()) {
            alert('Por favor, configure sua chave da API NVIDIA nas configurações.');
            this.showSettings();
            return;
        }

        // Clear input
        this.elements.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButton();

        // Hide welcome screen
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'none';
        }

        // Add user message to UI
        this.addMessageToUI('user', content);

        // Add typing indicator
        const typingId = this.addTypingIndicator();

        try {
            let assistantContent = '';
            const messageId = this.addMessageToUI('assistant', '');

            // Stream response
            await this.chat.sendMessage(content, (chunk) => {
                assistantContent += chunk;
                this.updateMessage(messageId, assistantContent);
            });

            // Remove typing indicator
            this.removeTypingIndicator(typingId);

            // Update conversations list
            this.renderConversations();

            // Scroll to bottom
            this.scrollToBottom();

        } catch (error) {
            this.removeTypingIndicator(typingId);
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
        }
    }

    /**
     * Handle new chat
     */
    async handleNewChat() {
        try {
            await this.chat.newConversation();
            this.renderCurrentConversation();
            this.renderConversations();
            this.elements.messageInput.focus();
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        if (!confirm('Deseja realmente sair?')) return;

        try {
            await this.firebase.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    /**
     * Add message to UI
     */
    addMessageToUI(role, content) {
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.id = messageId;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user'
            ? '<i class="ki-filled ki-profile-circle"></i>'
            : '<i class="ki-filled ki-technology-2"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = this.chat.formatMessage(content);

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = 'Agora';

        contentDiv.appendChild(bubble);
        contentDiv.appendChild(time);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return messageId;
    }

    /**
     * Update message content
     */
    updateMessage(messageId, content) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const bubble = messageDiv.querySelector('.message-bubble');
        if (bubble) {
            bubble.innerHTML = this.chat.formatMessage(content);
            this.scrollToBottom();
        }
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const indicatorId = 'typing-' + Date.now();
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'message assistant';
        indicatorDiv.id = indicatorId;

        indicatorDiv.innerHTML = `
            <div class="message-avatar">
                <i class="ki-filled ki-technology-2"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.elements.messagesContainer.appendChild(indicatorDiv);
        this.scrollToBottom();

        return indicatorId;
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator(indicatorId) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Render current conversation
     */
    renderCurrentConversation() {
        const conversation = this.chat.getCurrentConversation();

        if (!conversation) return;

        // Clear messages
        this.elements.messagesContainer.innerHTML = '';

        // Show welcome if no messages
        if (conversation.messages.length === 0) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-screen';
            welcomeDiv.id = 'welcome-screen';
            welcomeDiv.innerHTML = `
                <div class="welcome-icon">
                    <i class="ki-filled ki-message-text-2"></i>
                </div>
                <h2>Bem-vindo ao Bitaca AI Chat</h2>
                <p>Converse com os melhores modelos de IA da NVIDIA</p>
                <div class="quick-prompts">
                    <button class="quick-prompt" data-prompt="Explique o que é inteligência artificial de forma simples">
                        <i class="ki-filled ki-information"></i>
                        O que é IA?
                    </button>
                    <button class="quick-prompt" data-prompt="Me ajude a escrever um código Python para analisar dados">
                        <i class="ki-filled ki-code"></i>
                        Ajuda com código
                    </button>
                    <button class="quick-prompt" data-prompt="Sugira ideias criativas para um projeto de cinema">
                        <i class="ki-filled ki-technology-4"></i>
                        Ideias criativas
                    </button>
                </div>
            `;
            this.elements.messagesContainer.appendChild(welcomeDiv);

            // Re-attach quick prompt handlers
            document.querySelectorAll('.quick-prompt').forEach(btn => {
                btn.addEventListener('click', () => {
                    const prompt = btn.dataset.prompt;
                    this.elements.messageInput.value = prompt;
                    this.autoResizeTextarea();
                    this.updateSendButton();
                    this.elements.messageInput.focus();
                });
            });

            return;
        }

        // Render messages
        conversation.messages.forEach(message => {
            this.addMessageToUI(message.role, message.content);
        });

        this.scrollToBottom();
    }

    /**
     * Render conversations list
     */
    renderConversations() {
        const conversations = this.chat.getConversations();
        const current = this.chat.getCurrentConversation();

        this.elements.conversationsList.innerHTML = '';

        if (conversations.length === 0) {
            this.elements.conversationsList.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    Nenhuma conversa ainda
                </p>
            `;
            return;
        }

        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';

            if (current && conv.id === current.id) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div class="conversation-title">${conv.title}</div>
                <div class="conversation-meta">
                    <span>${conv.messages.length} mensagens</span>
                    <span>${this.chat.formatTimestamp(conv.updatedAt)}</span>
                </div>
            `;

            item.addEventListener('click', async () => {
                await this.chat.switchConversation(conv.id);
                this.renderCurrentConversation();
                this.renderConversations();
            });

            this.elements.conversationsList.appendChild(item);
        });
    }

    /**
     * Load models to modal
     */
    loadModels() {
        const models = this.nvidia.getModels();
        const current = this.nvidia.getCurrentModel();

        this.elements.modelsGrid.innerHTML = '';

        models.forEach(model => {
            const card = document.createElement('div');
            card.className = 'model-card';

            if (model.id === current.id) {
                card.classList.add('selected');
            }

            card.innerHTML = `
                <div class="model-card-header">
                    <div class="model-name">${model.name}</div>
                    <div class="model-badge">${model.badge}</div>
                </div>
                <div class="model-description">${model.description}</div>
                <div class="model-specs">
                    <span><i class="ki-filled ki-profile-circle"></i> ${model.provider}</span>
                    <span><i class="ki-filled ki-document"></i> ${model.contextLength.toLocaleString()} tokens</span>
                </div>
            `;

            card.addEventListener('click', () => {
                this.selectModel(model.id);
            });

            this.elements.modelsGrid.appendChild(card);
        });
    }

    /**
     * Select model
     */
    selectModel(modelId) {
        const model = this.chat.changeModel(modelId);

        if (model) {
            this.elements.currentModelName.textContent = model.name;
            this.loadModels();
            this.closeModal('model');
        }
    }

    /**
     * Load settings
     */
    loadSettings() {
        const settings = this.chat.getSettings();

        this.elements.temperatureSlider.value = settings.temperature;
        this.elements.temperatureValue.textContent = settings.temperature;

        this.elements.maxTokensSlider.value = settings.maxTokens;
        this.elements.maxTokensValue.textContent = settings.maxTokens;

        if (this.nvidia.hasApiKey()) {
            this.elements.apiKeyInput.value = '••••••••••••••••••••';
        }
    }

    /**
     * Save API key
     */
    async saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();

        if (!apiKey || apiKey.startsWith('•')) {
            return;
        }

        this.showLoading();

        try {
            this.nvidia.setApiKey(apiKey);

            // Test API
            const result = await this.nvidia.test();

            if (result.success) {
                alert('✅ API key salva com sucesso!');
                this.elements.apiKeyInput.value = '••••••••••••••••••••';
                this.closeModal('settings');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('❌ Erro ao validar API key: ' + error.message);
            this.nvidia.setApiKey('');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show model selector
     */
    showModelSelector() {
        this.elements.modelModal.classList.add('active');
    }

    /**
     * Show settings
     */
    showSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(`${modalId}-modal`);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Auto-resize textarea
     */
    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    /**
     * Update character count
     */
    updateCharCount() {
        const count = this.elements.messageInput.value.length;
        this.elements.charCount.textContent = count;
    }

    /**
     * Update send button state
     */
    updateSendButton() {
        const hasContent = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasContent;
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        setTimeout(() => {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * Show loading
     */
    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }

    /**
     * Hide loading
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bitacaChat = new BitacaChat();
});
