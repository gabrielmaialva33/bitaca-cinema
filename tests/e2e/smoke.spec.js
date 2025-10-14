const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests - Production', () => {
    test('Play homepage should be accessible', async ({ page }) => {
        // Navigate to Play (will redirect to login if not authenticated)
        const response = await page.goto('https://play.abitaca.com.br/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Check response is OK
        expect(response.status()).toBeLessThan(500);

        // Check page loaded
        await expect(page).toHaveTitle(/Bitaca/i);

        console.log('✅ Play homepage accessible');
    });

    test('Chat should be accessible', async ({ page }) => {
        const response = await page.goto('https://chat.abitaca.com.br/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        expect(response.status()).toBeLessThan(500);
        await expect(page).toHaveTitle(/Chat/i);

        console.log('✅ Chat accessible');
    });

    test.skip('Play 3D should be accessible', async ({ page }) => {
        // TODO: Enable when Play 3D domain is configured
        const response = await page.goto('https://play-3d.abitaca.com.br/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        expect(response.status()).toBeLessThan(500);

        console.log('✅ Play 3D accessible');
    });

    test('Main website should be accessible', async ({ page }) => {
        const response = await page.goto('https://www.abitaca.com.br/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        expect(response.status()).toBeLessThan(500);
        await expect(page).toHaveTitle(/Bitaca/i);

        console.log('✅ Main website accessible');
    });

    test('API health endpoint should respond', async ({ page }) => {
        const response = await page.goto('https://api.abitaca.com.br/health', {
            timeout: 10000
        });

        expect(response.status()).toBe(200);

        console.log('✅ API health check passed');
    });
});
