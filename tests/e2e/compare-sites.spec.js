const { test, expect } = require('@playwright/test');

test.describe('Comparar GitHub Pages vs Abitaca', () => {
    test('deve mostrar diferenças entre os sites', async ({ browser }) => {
        const context = await browser.newContext();
        
        // GitHub Pages
        const githubPage = await context.newPage();
        await githubPage.goto('https://gabrielmaialva33.github.io/bitaca-cinema/');
        await githubPage.waitForLoadState('networkidle');
        
        const githubData = await githubPage.evaluate(() => {
            const catalogoParagraph = document.querySelector('#catalogo')?.querySelector('p');
            const producoes = catalogoParagraph?.textContent?.match(/(\d+)\s+produções/)?.[1] || '0';
            const stats = document.querySelector('.hero-stats');
            const statsText = stats ? Array.from(stats.querySelectorAll('.stat-number')).map(el => el.textContent) : [];
            
            return {
                producoes,
                stats: statsText,
                lastModified: document.querySelector('meta[property="og:updated_time"]')?.content || 'N/A',
                url: window.location.href
            };
        });
        
        console.log('\n=== GITHUB PAGES ===');
        console.log('URL:', githubData.url);
        console.log('Produções:', githubData.producoes);
        console.log('Stats:', githubData.stats);
        console.log('Last Modified:', githubData.lastModified);
        
        // Abitaca
        const abitacaPage = await context.newPage();
        await abitacaPage.goto('https://www.abitaca.com.br/');
        await abitacaPage.waitForLoadState('networkidle');
        
        const abitacaData = await abitacaPage.evaluate(() => {
            const catalogoParagraph = document.querySelector('#catalogo')?.querySelector('p');
            const producoes = catalogoParagraph?.textContent?.match(/(\d+)\s+produções/)?.[1] || '0';
            const stats = document.querySelector('.hero-stats');
            const statsText = stats ? Array.from(stats.querySelectorAll('.stat-number')).map(el => el.textContent) : [];
            
            return {
                producoes,
                stats: statsText,
                lastModified: document.querySelector('meta[property="og:updated_time"]')?.content || 'N/A',
                url: window.location.href
            };
        });
        
        console.log('\n=== ABITACA.COM.BR ===');
        console.log('URL:', abitacaData.url);
        console.log('Produções:', abitacaData.producoes);
        console.log('Stats:', abitacaData.stats);
        console.log('Last Modified:', abitacaData.lastModified);
        
        console.log('\n=== DIFERENÇAS ===');
        console.log('Produções diferentes?', githubData.producoes !== abitacaData.producoes);
        console.log('Stats diferentes?', JSON.stringify(githubData.stats) !== JSON.stringify(abitacaData.stats));
        
        await context.close();
    });
});
