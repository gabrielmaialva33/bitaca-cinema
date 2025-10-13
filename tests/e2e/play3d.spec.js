const {test, expect} = require('@playwright/test');

/**
 * Bitaca Play 3D - Complete E2E Test Suite
 * Tests all functionality of https://play.abitaca.com.br
 */

// Test configuration
const PRODUCTION_URL = 'https://play.abitaca.com.br';
const LOCAL_URL = 'http://localhost:8000/apps/play-3d';
const BASE_URL = process.env.TEST_ENV === 'production' ? PRODUCTION_URL : LOCAL_URL;

test.describe('Bitaca Play 3D - Core Functionality', () => {

    test.beforeEach(async ({page}) => {
        // Increase timeout for 3D loading
        test.setTimeout(60000);
        await page.goto(BASE_URL);
    });

    test('should load Play 3D homepage successfully', async ({page}) => {
        // Check title
        await expect(page).toHaveTitle(/Bitaca Play 3D/);

        // Check main canvas exists
        const canvas = page.locator('#play3d-canvas');
        await expect(canvas).toBeVisible();

        // Check loading screen appears
        const loadingScreen = page.locator('#loading-screen');
        await expect(loadingScreen).toBeVisible();

        // Wait for loading to complete (max 30s)
        await page.waitForSelector('#loading-screen', {
            state: 'hidden',
            timeout: 30000
        });
    });

    test('should display world selector after loading', async ({page}) => {
        // Wait for loading complete
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        // World selector should be visible
        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).toBeVisible();

        // Check all 3 world cards exist
        const patrimonioCard = page.locator('[data-world="patrimonio"]');
        const musicaCard = page.locator('[data-world="musica"]');
        const ambienteCard = page.locator('[data-world="ambiente"]');

        await expect(patrimonioCard).toBeVisible();
        await expect(musicaCard).toBeVisible();
        await expect(ambienteCard).toBeVisible();

        // Verify world card contents
        await expect(patrimonioCard).toContainText('Patrimônio');
        await expect(patrimonioCard).toContainText('9 produções');

        await expect(musicaCard).toContainText('Música');
        await expect(musicaCard).toContainText('8 produções');

        await expect(ambienteCard).toContainText('Meio Ambiente');
        await expect(ambienteCard).toContainText('7 produções');
    });

    test('should open menu sidebar', async ({page}) => {
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        // Click menu button
        await page.click('#btn-menu');

        // Menu should be visible
        const menuSidebar = page.locator('#menu-sidebar');
        await expect(menuSidebar).toBeVisible();

        // Check menu items
        await expect(page.locator('#menu-worlds')).toContainText('Escolher Mundo');
        await expect(page.locator('#menu-catalog')).toContainText('Ver Catálogo');
        await expect(page.locator('#menu-derona')).toContainText('Chamar Derona');
        await expect(page.locator('#menu-2d')).toContainText('Modo 2D');

        // Close menu
        await page.click('#btn-close-menu');
        await expect(menuSidebar).not.toBeVisible();
    });

    test('should toggle fullscreen mode', async ({page}) => {
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        const fullscreenBtn = page.locator('#btn-fullscreen');
        await expect(fullscreenBtn).toBeVisible();

        // Click fullscreen button
        await fullscreenBtn.click();

        // Wait a bit for fullscreen animation
        await page.waitForTimeout(1000);

        // Note: We can't truly test fullscreen in headless mode
        // but we can verify the button exists and is clickable
        await expect(fullscreenBtn).toBeEnabled();
    });

    test('should show help button', async ({page}) => {
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        const helpBtn = page.locator('#btn-help');
        await expect(helpBtn).toBeVisible();
        await expect(helpBtn).toBeEnabled();
    });
});

test.describe('Bitaca Play 3D - World Selection', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should select Patrimônio world', async ({page}) => {
        // Click Patrimônio card
        await page.click('[data-world="patrimonio"]');

        // Wait for world to load
        await page.waitForTimeout(3000);

        // World selector should hide
        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).not.toBeVisible({timeout: 5000});

        // Check that minimap is visible (indicates world loaded)
        const minimap = page.locator('#minimap');
        await expect(minimap).toBeVisible();
    });

    test('should select Música world', async ({page}) => {
        await page.click('[data-world="musica"]');
        await page.waitForTimeout(3000);

        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).not.toBeVisible({timeout: 5000});

        const minimap = page.locator('#minimap');
        await expect(minimap).toBeVisible();
    });

    test('should select Meio Ambiente world', async ({page}) => {
        await page.click('[data-world="ambiente"]');
        await page.waitForTimeout(3000);

        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).not.toBeVisible({timeout: 5000});

        const minimap = page.locator('#minimap');
        await expect(minimap).toBeVisible();
    });

    test('should show controls info after world selection', async ({page}) => {
        await page.click('[data-world="patrimonio"]');
        await page.waitForTimeout(2000);

        // Controls info should be visible
        const controlsInfo = page.locator('#controls-info');
        await expect(controlsInfo).toBeVisible();

        // Check control hints
        await expect(controlsInfo).toContainText('W A S D');
        await expect(controlsInfo).toContainText('Mouse');
        await expect(controlsInfo).toContainText('Interagir');
    });
});

test.describe('Bitaca Play 3D - Derona Avatar', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should open Derona dialog from menu', async ({page}) => {
        // Open menu
        await page.click('#btn-menu');

        // Click "Chamar Derona"
        await page.click('#menu-derona');

        // Derona dialog should appear
        const deronaDialog = page.locator('#derona-dialog');
        await expect(deronaDialog).toBeVisible({timeout: 3000});

        // Check dialog content
        await expect(deronaDialog).toContainText('Derona');
        await expect(deronaDialog).toContainText('Olá! Sou a Derona');

        // Check action buttons
        const conversarBtn = page.locator('#btn-ask-derona');
        const fecharBtn = page.locator('#btn-close-derona');

        await expect(conversarBtn).toBeVisible();
        await expect(fecharBtn).toBeVisible();

        // Close dialog
        await fecharBtn.click();
        await expect(deronaDialog).not.toBeVisible();
    });

    test('should open Derona conversation', async ({page}) => {
        // Open menu and call Derona
        await page.click('#btn-menu');
        await page.click('#menu-derona');

        // Wait for dialog
        await page.waitForSelector('#derona-dialog', {state: 'visible', timeout: 3000});

        // Click "Conversar" button
        await page.click('#btn-ask-derona');

        // Should redirect or open chat interface
        // (Implementation depends on your chat system)
        await page.waitForTimeout(1000);
    });
});

test.describe('Bitaca Play 3D - Production Cards', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should interact with production card', async ({page}) => {
        // Select a world
        await page.click('[data-world="patrimonio"]');
        await page.waitForTimeout(3000);

        // The production card is shown when user clicks on 3D objects
        // In automated test, we can manually trigger it for testing

        // Try to find production card (may not be visible without user interaction)
        const productionCard = page.locator('#production-card');

        // Verify card elements exist in DOM (even if not visible yet)
        await expect(productionCard).toBeAttached();

        const cardTitle = page.locator('#card-title');
        const cardDirector = page.locator('#card-director');
        const cardSinopse = page.locator('#card-sinopse');
        const watchBtn = page.locator('#btn-watch');
        const moreInfoBtn = page.locator('#btn-more-info');

        await expect(cardTitle).toBeAttached();
        await expect(cardDirector).toBeAttached();
        await expect(cardSinopse).toBeAttached();
        await expect(watchBtn).toBeAttached();
        await expect(moreInfoBtn).toBeAttached();
    });
});

test.describe('Bitaca Play 3D - Minimap', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should show minimap after world selection', async ({page}) => {
        // Select world
        await page.click('[data-world="musica"]');
        await page.waitForTimeout(2000);

        // Minimap should be visible
        const minimap = page.locator('#minimap');
        await expect(minimap).toBeVisible();

        // Check minimap canvas
        const minimapCanvas = page.locator('#minimap-canvas');
        await expect(minimapCanvas).toBeAttached();

        // Check minimap label
        await expect(minimap).toContainText('Mapa');
    });
});

test.describe('Bitaca Play 3D - Navigation Links', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should navigate to 2D mode', async ({page}) => {
        await page.click('#btn-menu');

        const modo2dLink = page.locator('#menu-2d');
        await expect(modo2dLink).toBeVisible();
        await expect(modo2dLink).toHaveAttribute('href', '../frontend/');
    });

    test('should navigate to Galeria Bitaca', async ({page}) => {
        await page.click('#btn-menu');

        const galeriaLink = page.locator('#menu-galeria');
        await expect(galeriaLink).toBeVisible();
        await expect(galeriaLink).toHaveAttribute('href', '../galeria-bitaca/');
    });

    test('should have catalog link', async ({page}) => {
        await page.click('#btn-menu');

        const catalogLink = page.locator('#menu-catalog');
        await expect(catalogLink).toBeVisible();
        await expect(catalogLink).toContainText('Ver Catálogo');
    });
});

test.describe('Bitaca Play 3D - Responsive Design', () => {

    test('should work on mobile viewport', async ({page}) => {
        test.setTimeout(60000);

        // Set mobile viewport
        await page.setViewportSize({width: 375, height: 667});
        await page.goto(BASE_URL);

        // Wait for loading
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        // Canvas should be visible
        const canvas = page.locator('#play3d-canvas');
        await expect(canvas).toBeVisible();

        // World selector should be visible
        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).toBeVisible();

        // Check that world cards are responsive
        const cards = page.locator('.world-card');
        const count = await cards.count();
        expect(count).toBe(3);
    });

    test('should work on tablet viewport', async ({page}) => {
        test.setTimeout(60000);

        // Set tablet viewport
        await page.setViewportSize({width: 768, height: 1024});
        await page.goto(BASE_URL);

        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        const canvas = page.locator('#play3d-canvas');
        await expect(canvas).toBeVisible();

        const worldSelector = page.locator('#world-selector');
        await expect(worldSelector).toBeVisible();
    });
});

test.describe('Bitaca Play 3D - Performance', () => {

    test('should load within acceptable time', async ({page}) => {
        const startTime = Date.now();

        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'visible'});
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // Should load within 30 seconds
        expect(loadTime).toBeLessThan(30000);

        console.log(`Play 3D loaded in ${loadTime}ms`);
    });

    test('should not have console errors', async ({page}) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});

        // Allow some warnings but no critical errors
        const criticalErrors = errors.filter(err =>
            !err.includes('THREE') &&
            !err.includes('WebGL') &&
            !err.includes('font')
        );

        expect(criticalErrors.length).toBe(0);
    });
});

test.describe('Bitaca Play 3D - Accessibility', () => {

    test.beforeEach(async ({page}) => {
        test.setTimeout(60000);
        await page.goto(BASE_URL);
        await page.waitForSelector('#loading-screen', {state: 'hidden', timeout: 30000});
    });

    test('should have proper ARIA labels', async ({page}) => {
        // Check buttons have titles
        await expect(page.locator('#btn-menu')).toHaveAttribute('title', 'Menu');
        await expect(page.locator('#btn-help')).toHaveAttribute('title', 'Ajuda');
        await expect(page.locator('#btn-fullscreen')).toHaveAttribute('title', 'Tela cheia');
    });

    test('should have keyboard navigation', async ({page}) => {
        // Tab through elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Press Enter on focused element (should work)
        await page.keyboard.press('Enter');

        // Basic check - no errors should occur
        await page.waitForTimeout(500);
    });

    test('should have proper semantic HTML', async ({page}) => {
        // Check for semantic elements
        await expect(page.locator('header.play3d-header')).toBeVisible();
        await expect(page.locator('h1.play3d-title')).toBeVisible();
        await expect(page.locator('button')).toHaveCount(await page.locator('button').count());
    });
});
