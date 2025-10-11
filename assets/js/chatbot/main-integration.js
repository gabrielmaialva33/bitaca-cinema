// ===============================================
// BITACA CINEMA - CHATBOT INTEGRATION
// Conecta o chatbot com a interface do usuário
// ===============================================

(function () {
    'use strict';

    // Configuração
    const CONFIG = {
        API_KEY: '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',
        AUTO_OPEN_DELAY: 3000, // Abrir automaticamente após 3s (primeiro acesso)
        WELCOME_SHOWN_KEY: 'bitaca_chatbot_welcome_shown'
    };

    // Estado global
    let chatbot = null;
    let currentBotMessage = null;
    let isProcessing = false;

    /**
     * Inicialização quando DOM estiver pronto
     */
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🎬 Bitaca Chatbot Integration loading...');

        // Inicializar chatbot
        try {
            chatbot = new BitacaAIChatbot(CONFIG.API_KEY);
            await chatbot.initialize();
            console.log('✅ Chatbot initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize chatbot:', error);
            return;
        }

        // Setup UI
        setupUI();
        setupEventListeners();

        // Auto-open para novos visitantes
        if (!localStorage.getItem(CONFIG.WELCOME_SHOWN_KEY)) {
            setTimeout(() => {
                openChat();
                localStorage.setItem(CONFIG.WELCOME_SHOWN_KEY, 'true');
            }, CONFIG.AUTO_OPEN_DELAY);
        }
    });

    /**
     * Setup UI elements
     */
    function setupUI() {
        const fab = document.getElementById('chatbot-fab');
        const container = document.getElementById('chatbot-container');
        const messages = document.getElementById('chatbot-messages');

        if (!fab || !container || !messages) {
            console.warn('Chatbot UI elements not found');
            return;
        }

        // Add welcome message
        addWelcomeMessage();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const fab = document.getElementById('chatbot-fab');
        const closeBtn = document.getElementById('close-chat');
        const clearBtn = document.getElementById('clear-chat');
        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('chatbot-input');

        // Toggle chat
        if (fab) {
            fab.addEventListener('click', toggleChat);
        }

        // Close chat
        if (closeBtn) {
            closeBtn.addEventListener('click', closeChat);
        }

        // Clear conversation
        if (clearBtn) {
            clearBtn.addEventListener('click', clearConversation);
        }

        // Send message
        if (sendBtn) {
            sendBtn.addEventListener('click', handleSendMessage);
        }

        // Input handling
        if (input) {
            // Auto-resize textarea
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';

                // Enable/disable send button
                if (sendBtn) {
                    sendBtn.disabled = !input.value.trim() || isProcessing;
                }
            });

            // Enter to send (Shift+Enter for new line)
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isProcessing) {
                        handleSendMessage();
                    }
                }
            });
        }

        // Quick suggestions
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (input) {
                    input.value = chip.dataset.suggestion;
                    input.focus();
                    handleSendMessage();
                }
            });
        });
    }

    /**
     * Toggle chat window
     */
    function toggleChat() {
        const container = document.getElementById('chatbot-container');
        if (container) {
            if (container.classList.contains('active')) {
                closeChat();
            } else {
                openChat();
            }
        }
    }

    /**
     * Open chat window
     */
    function openChat() {
        const container = document.getElementById('chatbot-container');
        const input = document.getElementById('chatbot-input');
        const badge = document.getElementById('chatbot-badge');

        if (container) {
            container.classList.add('active');

            if (input) {
                setTimeout(() => input.focus(), 300);
            }

            // Clear badge
            if (badge) {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Close chat window
     */
    function closeChat() {
        const container = document.getElementById('chatbot-container');
        if (container) {
            container.classList.remove('active');
        }
    }

    /**
     * Clear conversation
     */
    function clearConversation() {
        if (!confirm('Limpar toda a conversa?')) {
            return;
        }

        const messages = document.getElementById('chatbot-messages');
        if (messages) {
            // Remove all messages except welcome
            messages.innerHTML = '';
            addWelcomeMessage();
        }

        if (chatbot) {
            chatbot.clearHistory();
        }

        console.log('🗑️ Conversation cleared');
    }

    /**
     * Handle send message
     */
    async function handleSendMessage() {
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('send-btn');

        if (!input || !chatbot) return;

        const message = input.value.trim();
        if (!message || isProcessing) return;

        // Disable input
        isProcessing = true;
        input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Add user message to UI
        appendMessage(message, 'user');

        // Hide suggestions
        const suggestions = document.querySelector('.quick-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }

        // Show typing indicator
        showTypingIndicator();

        try {
            // Send to chatbot with streaming
            await chatbot.sendMessage(
                message,
                // onToken callback (streaming)
                (token, fullText) => {
                    updateBotMessage(fullText);
                },
                // onComplete callback
                (finalResponse, productions) => {
                    hideTypingIndicator();

                    // Finalize bot message
                    currentBotMessage = null;

                    // Add production cards if found
                    if (productions && productions.length > 0) {
                        appendProductionCards(productions);
                    }

                    // Re-enable input
                    isProcessing = false;
                    input.disabled = false;
                    if (sendBtn) sendBtn.disabled = false;
                    input.focus();
                }
            );
        } catch (error) {
            console.error('Message error:', error);

            hideTypingIndicator();
            appendMessage('Desculpe, tive um problema técnico. Tente novamente. 🔧', 'bot');

            // Re-enable input
            isProcessing = false;
            input.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            input.focus();
        }
    }

    /**
     * Add welcome message
     */
    function addWelcomeMessage() {
        const welcomeHTML = `
      <div class="chatbot-message bot-message">
        <div class="message-avatar">🎬</div>
        <div class="message-content">
          <div class="message-bubble">
            Olá! 👋 Sou o assistente do <strong>Bitaca Cinema</strong>.<br><br>
            Posso te ajudar a:
            <ul style="margin: 10px 0 0 0; padding-left: 20px; line-height: 1.8;">
              <li>🔍 Encontrar produções</li>
              <li>💡 Recomendar filmes</li>
              <li>📚 Explicar as leis de fomento</li>
              <li>🏛️ Informações sobre o Bitaca</li>
            </ul>
          </div>
          <div class="message-timestamp">${getCurrentTime()}</div>
        </div>
      </div>
    `;

        const messages = document.getElementById('chatbot-messages');
        if (messages) {
            messages.insertAdjacentHTML('beforeend', welcomeHTML);
        }
    }

    /**
     * Append user/bot message
     */
    function appendMessage(text, role) {
        const messages = document.getElementById('chatbot-messages');
        if (!messages) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chatbot-message ${role}-message`;
        messageEl.innerHTML = `
      <div class="message-avatar">${role === 'user' ? '👤' : '🎬'}</div>
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(text)}</div>
        <div class="message-timestamp">${getCurrentTime()}</div>
      </div>
    `;

        messages.appendChild(messageEl);
        scrollToBottom();
    }

    /**
     * Update bot message (for streaming)
     */
    function updateBotMessage(text) {
        const messages = document.getElementById('chatbot-messages');
        if (!messages) return;

        if (!currentBotMessage) {
            // Create new bot message
            currentBotMessage = document.createElement('div');
            currentBotMessage.className = 'chatbot-message bot-message';
            currentBotMessage.innerHTML = `
        <div class="message-avatar">🎬</div>
        <div class="message-content">
          <div class="message-bubble"></div>
          <div class="message-timestamp">${getCurrentTime()}</div>
        </div>
      `;
            messages.appendChild(currentBotMessage);
        }

        // Update bubble content
        const bubble = currentBotMessage.querySelector('.message-bubble');
        if (bubble) {
            bubble.textContent = text;
        }

        scrollToBottom();
    }

    /**
     * Append production cards
     */
    function appendProductionCards(productions) {
        const messages = document.getElementById('chatbot-messages');
        if (!messages) return;

        productions.forEach(prod => {
            const cardEl = document.createElement('div');
            cardEl.className = 'production-card';
            cardEl.innerHTML = `
        <div class="production-card-header">
          <div class="production-card-icon">${getIconForTema(prod.metadata.tema)}</div>
          <div>
            <h5 class="production-card-title">${escapeHtml(prod.titulo)}</h5>
            <p class="production-card-director">Por ${escapeHtml(prod.metadata.diretor)}</p>
          </div>
        </div>
        <div class="production-card-body">
          ${escapeHtml(prod.metadata.sinopse.substring(0, 120))}...
        </div>
        <div class="production-card-footer">
          <button class="card-action-btn" onclick="window.scrollToProduction('${prod.id}')">
            Ver Detalhes
          </button>
        </div>
      `;
            messages.appendChild(cardEl);
        });

        scrollToBottom();
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            scrollToBottom();
        }
    }

    /**
     * Hide typing indicator
     */
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Scroll messages to bottom
     */
    function scrollToBottom() {
        const messages = document.getElementById('chatbot-messages');
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    /**
     * Get current time string
     */
    function getCurrentTime() {
        return new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get icon for tema
     */
    function getIconForTema(tema) {
        const icons = {
            'patrimonio': '🏛️',
            'musica': '🎵',
            'ambiente': '🌿',
            'default': '🎬'
        };
        return icons[tema.toLowerCase()] || icons.default;
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Global function to scroll to production
     */
    window.scrollToProduction = function (id) {
        closeChat();

        setTimeout(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.scrollIntoView({behavior: 'smooth', block: 'center'});

                // Highlight effect
                element.style.transition = 'all 0.5s ease';
                element.style.boxShadow = '0 0 30px rgba(196, 30, 58, 0.5)';

                setTimeout(() => {
                    element.style.boxShadow = '';
                }, 2000);
            }
        }, 300);
    };

})();
