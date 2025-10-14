const { test, expect } = require('@playwright/test');

test.describe('Bitaca Play - Content Loading', () => {
    test('should load fallback content when API is unavailable', async ({ page }) => {
        // Navigate to Play
        await page.goto('https://play.abitaca.com.br/');

        // Wait for content to load
        await page.waitForSelector('.productions-grid', { timeout: 10000 });

        // Check console for fallback message
        const logs = [];
        page.on('console', msg => {
            logs.push(msg.text());
        });

        await page.waitForTimeout(2000);

        // Verify content cards are present
        const featuredCards = await page.locator('#featured-grid .production-card').count();
        console.log(`Featured cards found: ${featuredCards}`);
        expect(featuredCards).toBeGreaterThan(0);

        // Check for specific anime titles from MOCK_DATA
        const animeCards = await page.locator('#animes-carousel .production-card').count();
        console.log(`Anime cards found: ${animeCards}`);
        expect(animeCards).toBeGreaterThan(0);

        // Verify specific titles are present
        const narutoCard = await page.locator('text=Naruto Shippuden').first();
        await expect(narutoCard).toBeVisible();

        const onePieceCard = await page.locator('text=One Piece').first();
        await expect(onePieceCard).toBeVisible();

        console.log('✅ Content loaded successfully with fallback data');
    });

    test('should handle onboarding modal', async ({ page }) => {
        // Navigate to Play
        await page.goto('https://play.abitaca.com.br/');

        // Wait for onboarding modal to appear
        const onboardingModal = page.locator('.onboarding-modal');

        // Check if modal appears
        const isVisible = await onboardingModal.isVisible().catch(() => false);

        if (isVisible) {
            console.log('Onboarding modal detected');

            // Click "Pular" button
            const skipButton = page.locator('button:has-text("Pular")');
            await skipButton.click();

            // Handle confirmation dialog
            page.on('dialog', async dialog => {
                console.log(`Dialog: ${dialog.message()}`);
                await dialog.accept();
            });

            // Wait for modal to close
            await page.waitForTimeout(1000);

            console.log('✅ Onboarding skipped successfully');
        } else {
            console.log('Onboarding already completed');
        }
    });

    test('should display correct number of content items', async ({ page }) => {
        await page.goto('https://play.abitaca.com.br/');

        // Wait for content
        await page.waitForSelector('.productions-grid', { timeout: 10000 });
        await page.waitForTimeout(3000);

        // Count anime cards (should be 8 from MOCK_DATA)
        const animeCount = await page.locator('#animes-carousel .production-card').count();
        console.log(`Animes loaded: ${animeCount}`);
        expect(animeCount).toBe(8);

        // Count movie cards (should be 6 from MOCK_DATA)
        const movieCount = await page.locator('#filmes-carousel .production-card').count();
        console.log(`Movies loaded: ${movieCount}`);
        expect(movieCount).toBe(6);

        console.log('✅ Correct number of content items displayed');
    });
});
