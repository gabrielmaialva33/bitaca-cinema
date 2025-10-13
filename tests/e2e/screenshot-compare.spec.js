const { test } = require('@playwright/test');

test.describe('Screenshots Comparação', () => {
    test('capturar screenshots dos dois sites', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        
        // GitHub Pages
        const githubPage = await context.newPage();
        await githubPage.goto('https://gabrielmaialva33.github.io/bitaca-cinema/', { waitUntil: 'networkidle' });
        await githubPage.screenshot({ path: '/tmp/github-pages.png', fullPage: true });
        console.log('✅ GitHub Pages screenshot saved to /tmp/github-pages.png');
        
        // Abitaca
        const abitacaPage = await context.newPage();
        await abitacaPage.goto('https://www.abitaca.com.br/', { waitUntil: 'networkidle' });
        await abitacaPage.screenshot({ path: '/tmp/abitaca.png', fullPage: true });
        console.log('✅ Abitaca screenshot saved to /tmp/abitaca.png');
        
        // Capturar hero section
        await githubPage.goto('https://gabrielmaialva33.github.io/bitaca-cinema/');
        const githubHero = await githubPage.locator('.hero-content').first();
        await githubHero.screenshot({ path: '/tmp/github-hero.png' });
        
        await abitacaPage.goto('https://www.abitaca.com.br/');
        const abitacaHero = await abitacaPage.locator('.hero-content').first();
        await abitacaHero.screenshot({ path: '/tmp/abitaca-hero.png' });
        
        console.log('✅ Hero sections captured');
        
        await context.close();
    });
});
