const {test, expect} = require('@playwright/test');

test.describe('Chatbot Deronas', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar o botão do chatbot', async ({page}) => {
        const chatbotFAB = page.locator('#chatbot-fab');
        await expect(chatbotFAB).toBeVisible();
    });

    test('deve abrir o chatbot ao clicar no botão', async ({page}) => {
        // Clica no FAB do chatbot
        await page.click('#chatbot-fab');

        // Verifica se o container está visível
        const chatContainer = page.locator('#chatbot-container');
        await expect(chatContainer).toHaveClass(/active/);

        // Verifica mensagem de boas-vindas
        const welcomeMessage = page.locator('.chatbot-message.bot-message').first();
        await expect(welcomeMessage).toBeVisible();
        await expect(welcomeMessage).toContainText('Bitaca Cinema');
    });

    test('deve enviar mensagem e receber resposta', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');

        // Espera o container estar ativo
        await page.waitForSelector('#chatbot-container.active');

        // Digita uma mensagem
        const input = page.locator('#chatbot-input');
        await input.fill('Olá');

        // Clica em enviar
        await page.click('#send-btn');

        // Espera aparecer mensagem do usuário
        const userMessage = page.locator('.chatbot-message.user-message').last();
        await expect(userMessage).toBeVisible();
        await expect(userMessage).toContainText('Olá');

        // Espera aparecer resposta do bot (pode demorar por causa da API)
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 30000});

        // Verifica que a resposta não está vazia
        const botMessageText = await botResponse.locator('.message-bubble').textContent();
        expect(botMessageText.length).toBeGreaterThan(0);
    });

    test('deve fechar o chatbot ao clicar no X', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Fecha o chatbot
        await page.click('#close-chat');

        // Verifica que não está mais ativo
        const chatContainer = page.locator('#chatbot-container');
        await expect(chatContainer).not.toHaveClass(/active/);
    });

    test('deve mostrar typing indicator durante processamento', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Digita e envia mensagem
        await page.fill('#chatbot-input', 'Quais produções você tem?');
        await page.click('#send-btn');

        // Verifica que o typing indicator aparece
        const typingIndicator = page.locator('#typing-indicator');
        await expect(typingIndicator).toBeVisible({timeout: 5000});

        // Aguarda desaparecer (resposta chegou)
        await expect(typingIndicator).toBeHidden({timeout: 30000});
    });

    test('deve desabilitar input durante processamento', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Digita e envia
        const input = page.locator('#chatbot-input');
        await input.fill('Teste');
        await page.click('#send-btn');

        // Verifica que o input está desabilitado
        await expect(input).toBeDisabled();

        // Aguarda habilitar novamente
        await expect(input).toBeEnabled({timeout: 30000});
    });

    test('deve exibir sugestões rápidas', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Verifica se existem chips de sugestão
        const suggestions = page.locator('.suggestion-chip');
        const count = await suggestions.count();
        expect(count).toBeGreaterThan(0);
    });

    test('deve clicar em sugestão e enviar automaticamente', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Clica na primeira sugestão
        const firstSuggestion = page.locator('.suggestion-chip').first();
        const suggestionText = await firstSuggestion.getAttribute('data-suggestion');

        if (suggestionText) {
            await firstSuggestion.click();

            // Verifica que a mensagem foi enviada
            const userMessage = page.locator('.chatbot-message.user-message').last();
            await expect(userMessage).toBeVisible();
        }
    });

    test('deve permitir Enter para enviar mensagem', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Digita e pressiona Enter
        const input = page.locator('#chatbot-input');
        await input.fill('Teste Enter');
        await input.press('Enter');

        // Verifica que a mensagem foi enviada
        const userMessage = page.locator('.chatbot-message.user-message').last();
        await expect(userMessage).toContainText('Teste Enter');
    });

    test('deve limpar conversa ao clicar em limpar', async ({page}) => {
        // Abre o chatbot
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Envia uma mensagem
        await page.fill('#chatbot-input', 'Teste');
        await page.click('#send-btn');

        // Aguarda mensagem aparecer
        await page.waitForSelector('.chatbot-message.user-message');

        // Clica em limpar e confirma
        page.on('dialog', dialog => dialog.accept());
        await page.click('#clear-chat');

        // Verifica que só tem a mensagem de boas-vindas
        const messages = page.locator('.chatbot-message');
        const count = await messages.count();
        expect(count).toBe(1); // Apenas welcome message
    });
});

test.describe('Chatbot Integration', () => {
    test('deve conectar com a API corretamente', async ({page}) => {
        // Intercepta requisições para a API
        let apiCalled = false;
        page.on('request', request => {
            if (request.url().includes('api.abitaca.com.br/api/chat/completions')) {
                apiCalled = true;
            }
        });

        await page.goto('/');
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Envia mensagem
        await page.fill('#chatbot-input', 'Olá');
        await page.click('#send-btn');

        // Aguarda um pouco para garantir que a requisição foi feita
        await page.waitForTimeout(2000);

        // Verifica que a API foi chamada
        expect(apiCalled).toBeTruthy();
    });

    test('deve mostrar erro se a API falhar', async ({page}) => {
        // Simula falha na API
        await page.route('**/api/chat/completions', route => {
            route.abort('failed');
        });

        await page.goto('/');
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Tenta enviar mensagem
        await page.fill('#chatbot-input', 'Teste');
        await page.click('#send-btn');

        // Verifica mensagem de erro
        const errorMessage = page.locator('.chatbot-message.bot-message').last();
        await expect(errorMessage).toContainText('problema técnico', {timeout: 10000});
    });
});
