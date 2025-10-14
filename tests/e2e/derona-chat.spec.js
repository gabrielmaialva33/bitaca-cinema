const { test, expect } = require('@playwright/test');

test.describe('Derona Chat - Bitaca Play', () => {
    test.beforeEach(async ({ page }) => {
        // Note: This test requires authentication
        // For now, we'll test the chat UI elements
        await page.goto('https://play.abitaca.com.br/');
    });

    test('Chat sidebar should be visible', async ({ page }) => {
        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check if chat sidebar exists
        const chatSidebar = page.locator('#chat-sidebar, .chat-sidebar');
        await expect(chatSidebar).toBeVisible({ timeout: 10000 });

        console.log('✅ Chat sidebar visible');
    });

    test('Chat header should display Derona info', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check chat header
        const chatHeader = page.locator('.chat-header');
        await expect(chatHeader).toBeVisible();

        // Check Derona title
        const chatTitle = page.locator('.chat-title');
        await expect(chatTitle).toContainText(/Derona/i);

        console.log('✅ Derona info displayed');
    });

    test('Chat input should be present', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check chat input
        const chatInput = page.locator('#chat-input, .chat-input');
        await expect(chatInput).toBeVisible();

        // Check placeholder
        const placeholder = await chatInput.getAttribute('placeholder');
        console.log('Chat placeholder:', placeholder);

        console.log('✅ Chat input present');
    });

    test('Send button should be present', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check send button
        const sendBtn = page.locator('#send-btn, .send-btn');
        await expect(sendBtn).toBeVisible();

        console.log('✅ Send button present');
    });

    test('Voice button should be present', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check voice button
        const voiceBtn = page.locator('#voice-btn, .voice-btn');
        await expect(voiceBtn).toBeVisible();

        console.log('✅ Voice button present');
    });

    test('Suggestion buttons should be present', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check suggestion buttons
        const suggestions = page.locator('.suggestion-btn');
        const count = await suggestions.count();

        console.log(`Found ${count} suggestion buttons`);
        expect(count).toBeGreaterThan(0);

        // Check first suggestion
        if (count > 0) {
            const firstSuggestion = suggestions.first();
            const text = await firstSuggestion.textContent();
            console.log('First suggestion:', text);
        }

        console.log('✅ Suggestion buttons present');
    });

    test('Initial bot message should be displayed', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Check for bot message
        const botMessages = page.locator('.bot-message, .message.bot');
        const count = await botMessages.count();

        expect(count).toBeGreaterThan(0);

        const firstMessage = botMessages.first();
        const messageText = await firstMessage.textContent();

        console.log('Bot initial message:', messageText);
        expect(messageText).toContain('Derona');

        console.log('✅ Initial bot message displayed');
    });

    test('Chat input should enable send button when typing', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const chatInput = page.locator('#chat-input, .chat-input');
        const sendBtn = page.locator('#send-btn, .send-btn');

        // Initially disabled
        await expect(sendBtn).toBeDisabled();

        // Type something
        await chatInput.fill('Olá Derona!');

        // Should be enabled now
        await expect(sendBtn).toBeEnabled();

        console.log('✅ Send button enables on input');
    });

    test('Suggestion button should populate input', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const chatInput = page.locator('#chat-input, .chat-input');
        const suggestions = page.locator('.suggestion-btn');

        if (await suggestions.count() > 0) {
            const firstSuggestion = suggestions.first();
            const suggestionText = await firstSuggestion.getAttribute('data-suggestion');

            // Click suggestion
            await firstSuggestion.click();

            // Wait a bit
            await page.waitForTimeout(500);

            // Check if input has text
            const inputValue = await chatInput.inputValue();
            console.log('Input value after suggestion:', inputValue);

            expect(inputValue.length).toBeGreaterThan(0);

            console.log('✅ Suggestion populates input');
        }
    });

    test('Check console for chat-related errors', async ({ page }) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('https://play.abitaca.com.br/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('Console errors:', errors.length);
        errors.forEach(err => {
            if (err.includes('chat') || err.includes('derona')) {
                console.log('Chat error:', err);
            }
        });

        console.log('✅ Console errors logged');
    });
});
