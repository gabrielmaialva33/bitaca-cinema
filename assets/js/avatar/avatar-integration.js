// ===============================================
// BITACA CINEMA - AVATAR CHATBOT INTEGRATION
// Integrates 3D Avatar with existing chatbot
// ===============================================

import BitacaAvatar3D from './Avatar3D.js';

/**
 * AvatarChatbotIntegration
 * Connects the 3D avatar with the Bitaca AI chatbot
 */
class AvatarChatbotIntegration {
    constructor(chatbotInstance) {
        this.chatbot = chatbotInstance;
        this.avatar = null;
        this.avatarContainer = null;
        this.isAvatarEnabled = false;
        this.avatarToggleButton = null;
        this.uiCreated = false;

        console.log('🤖 Initializing Avatar-Chatbot Integration...');
    }

    /**
     * Initialize and inject avatar into chatbot UI
     */
    init() {
        // Hook into chatbot message events first
        this.hookChatbotEvents();

        // Wait for chatbot to open before creating UI
        this.waitForChatbotOpen();

        console.log('✅ Avatar-Chatbot integration ready!');
    }

    /**
     * Wait for chatbot to open and create UI
     */
    waitForChatbotOpen() {
        const checkInterval = setInterval(() => {
            const container = document.getElementById('chatbot-container');
            if (container && container.classList.contains('active') && !this.uiCreated) {
                clearInterval(checkInterval);
                this.createAvatarUI();
                this.createToggleButton();
                this.uiCreated = true;
                console.log('✅ Avatar UI created after chatbot opened');
            }
        }, 100);

        // Cleanup after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    /**
     * Create avatar container in chatbot UI
     */
    createAvatarUI() {
        // Find chatbot container
        const chatbotWidget = document.querySelector('#bitaca-chatbot');
        if (!chatbotWidget) {
            console.error('❌ Chatbot widget not found');
            return;
        }

        // Create avatar container
        this.avatarContainer = document.createElement('div');
        this.avatarContainer.className = 'bitaca-avatar-container';
        this.avatarContainer.style.cssText = `
            width: 100%;
            height: 300px;
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            border-radius: 12px 12px 0 0;
            overflow: hidden;
            position: relative;
            display: none;
            border-bottom: 2px solid #c41e3a;
        `;

        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'avatar-loading';
        loadingIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #c41e3a;
            font-size: 14px;
            font-weight: 500;
        `;
        loadingIndicator.textContent = '⏳ Carregando avatar...';
        this.avatarContainer.appendChild(loadingIndicator);

        // Insert avatar container at the top of chatbot messages area
        const chatbotBody = chatbotWidget.querySelector('#chatbot-container');
        if (chatbotBody) {
            chatbotBody.insertBefore(this.avatarContainer, chatbotBody.firstChild);
        }
    }

    /**
     * Create toggle button for avatar
     */
    createToggleButton() {
        // Find chatbot header
        const chatbotHeader = document.querySelector('.chatbot-header');
        if (!chatbotHeader) {
            console.error('❌ Chatbot header not found');
            return;
        }

        // Create toggle button
        this.avatarToggleButton = document.createElement('button');
        this.avatarToggleButton.className = 'avatar-toggle-btn';
        this.avatarToggleButton.innerHTML = '🎬';
        this.avatarToggleButton.title = 'Ativar Avatar 3D';
        this.avatarToggleButton.style.cssText = `
            background: rgba(196, 30, 58, 0.2);
            border: 2px solid #c41e3a;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 10px;
        `;

        this.avatarToggleButton.addEventListener('mouseenter', () => {
            this.avatarToggleButton.style.background = 'rgba(196, 30, 58, 0.4)';
            this.avatarToggleButton.style.transform = 'scale(1.1)';
        });

        this.avatarToggleButton.addEventListener('mouseleave', () => {
            this.avatarToggleButton.style.background = 'rgba(196, 30, 58, 0.2)';
            this.avatarToggleButton.style.transform = 'scale(1)';
        });

        this.avatarToggleButton.addEventListener('click', () => {
            this.toggleAvatar();
        });

        // Add button to header
        const headerActions = chatbotHeader.querySelector('.chatbot-header-actions');
        if (headerActions) {
            headerActions.appendChild(this.avatarToggleButton);
        }
    }

    /**
     * Toggle avatar ON/OFF
     */
    toggleAvatar() {
        this.isAvatarEnabled = !this.isAvatarEnabled;

        if (this.isAvatarEnabled) {
            this.enableAvatar();
        } else {
            this.disableAvatar();
        }
    }

    /**
     * Enable avatar
     */
    enableAvatar() {
        console.log('🎬 Enabling 3D Avatar...');

        // Show avatar container
        this.avatarContainer.style.display = 'block';

        // Initialize avatar if not already created
        if (!this.avatar) {
            // Remove loading indicator
            const loadingIndicator = this.avatarContainer.querySelector('.avatar-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }

            // Create avatar
            this.avatar = new BitacaAvatar3D(this.avatarContainer);

            // Welcome message
            setTimeout(() => {
                this.avatar.speak('Olá! Sou o assistente virtual do Bitaca Cinema. Como posso te ajudar hoje?');
            }, 1000);
        }

        // Update button
        this.avatarToggleButton.innerHTML = '🎭';
        this.avatarToggleButton.title = 'Desativar Avatar 3D';
        this.avatarToggleButton.style.background = 'rgba(196, 30, 58, 0.5)';

        console.log('✅ Avatar enabled');
    }

    /**
     * Disable avatar
     */
    disableAvatar() {
        console.log('🎬 Disabling 3D Avatar...');

        // Hide avatar container
        this.avatarContainer.style.display = 'none';

        // Stop any ongoing speech
        if (this.avatar) {
            this.avatar.stopSpeaking();
        }

        // Update button
        this.avatarToggleButton.innerHTML = '🎬';
        this.avatarToggleButton.title = 'Ativar Avatar 3D';
        this.avatarToggleButton.style.background = 'rgba(196, 30, 58, 0.2)';

        console.log('✅ Avatar disabled');
    }

    /**
     * Hook into chatbot events
     */
    hookChatbotEvents() {
        // Override the chatbot's message display function
        const originalOnComplete = this.chatbot.sendMessage;

        // Intercept chatbot responses
        const self = this;
        this.chatbot.sendMessage = async function(userMessage, onToken, onComplete) {
            // Call original sendMessage
            const wrappedOnComplete = (finalResponse, productions) => {
                // Speak the response if avatar is enabled
                if (self.isAvatarEnabled && self.avatar) {
                    self.speakResponse(finalResponse);
                }

                // Call original onComplete
                if (onComplete) {
                    onComplete(finalResponse, productions);
                }
            };

            // Call original with wrapped callback
            return originalOnComplete.call(this, userMessage, onToken, wrappedOnComplete);
        };

        console.log('✅ Chatbot events hooked');
    }

    /**
     * Speak chatbot response using avatar
     * @param {string} text - Text to speak
     */
    speakResponse(text) {
        if (!this.isAvatarEnabled || !this.avatar) {
            return;
        }

        // Clean markdown from text
        const cleanText = this.cleanMarkdown(text);

        // Speak
        this.avatar.speak(cleanText);
    }

    /**
     * Clean markdown formatting from text
     * @param {string} text - Text with markdown
     * @returns {string} - Clean text
     */
    cleanMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
            .replace(/\*(.*?)\*/g, '$1')      // Italic
            .replace(/#{1,6}\s/g, '')         // Headers
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
            .replace(/`(.*?)`/g, '$1')        // Code
            .replace(/\n/g, ' ')              // Newlines
            .trim();
    }

    /**
     * Destroy integration
     */
    destroy() {
        console.log('🗑️ Destroying Avatar-Chatbot Integration');

        if (this.avatar) {
            this.avatar.destroy();
            this.avatar = null;
        }

        if (this.avatarContainer) {
            this.avatarContainer.remove();
        }

        if (this.avatarToggleButton) {
            this.avatarToggleButton.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarChatbotIntegration;
}

export default AvatarChatbotIntegration;
