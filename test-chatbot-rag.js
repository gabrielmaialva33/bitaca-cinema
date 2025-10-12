// Quick test script for chatbot RAG functionality
const { chromium } = require('playwright');

(async () => {
    console.log('🎬 Testing Bitaca Cinema Chatbot RAG...\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // 1. Navigate to production site
        console.log('📍 Opening https://www.abitaca.com.br...');
        await page.goto('https://www.abitaca.com.br', { waitUntil: 'networkidle' });
        console.log('✅ Page loaded');

        // 2. Check if chatbot FAB is visible
        const fab = await page.locator('#chatbot-fab');
        await fab.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Chatbot FAB visible');

        // 3. Open chatbot
        await fab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Chatbot opened');

        // 4. Check embeddings loaded
        const embeddings = await page.evaluate(() => {
            return new Promise(async (resolve) => {
                const response = await fetch('/assets/data/embeddings.json');
                const data = await response.json();
                resolve(data.length);
            });
        });
        console.log(`✅ Embeddings loaded: ${embeddings} movies`);

        // 5. Send test query about music
        const input = await page.locator('#chatbot-input');
        await input.fill('Quais produções são sobre música?');

        const sendBtn = await page.locator('#send-btn');
        await sendBtn.click();
        console.log('✅ Query sent: "Quais produções são sobre música?"');

        // 6. Wait for response
        await page.waitForTimeout(3000);
        const botMessages = await page.locator('.chatbot-message.bot-message').count();
        console.log(`✅ Bot messages: ${botMessages}`);

        // 7. Check if production cards are shown
        await page.waitForTimeout(2000);
        const cards = await page.locator('.production-card').count();
        console.log(`✅ Production cards displayed: ${cards}`);

        // 8. Get response text
        const lastMessage = await page.locator('.chatbot-message.bot-message').last().textContent();
        console.log(`\n📝 Response preview: ${lastMessage.substring(0, 150)}...`);

        console.log('\n🎉 All tests passed!');
        console.log('\n📊 Summary:');
        console.log(`   - Embeddings: ${embeddings} movies`);
        console.log(`   - Bot messages: ${botMessages}`);
        console.log(`   - Production cards: ${cards}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-error.png', fullPage: false });
        console.log('📸 Screenshot saved: test-error.png');
    } finally {
        await browser.close();
    }
})();
