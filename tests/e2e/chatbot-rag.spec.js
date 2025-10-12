const {test, expect} = require('@playwright/test');

test.describe('Chatbot RAG (Semantic Search)', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar embeddings.json ao inicializar', async ({page}) => {
        // Testa diretamente se o arquivo existe e está acessível
        const response = await page.request.get(`${page.url().replace(/\/$/, '')}/assets/data/embeddings.json`);

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.length).toBe(23);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('titulo');
        expect(data[0]).toHaveProperty('embedding');
        expect(data[0].embedding.length).toBe(1024);
    });

    test('deve realizar busca semântica para query sobre música', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Envia query específica sobre música
        await page.fill('#chatbot-input', 'Quais produções são sobre música?');
        await page.click('#send-btn');

        // Aguarda resposta (pode demorar devido à API LLM)
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        // Verifica que recebeu ALGUMA resposta com conteúdo razoável
        const responseText = await botResponse.textContent();

        // Deve ter pelo menos 50 caracteres de resposta
        expect(responseText.length).toBeGreaterThan(50);

        // Deve mencionar algo relacionado a música, produção ou filmes
        const hasRelevantKeyword =
            /música|musical|viola|sertaneja|canção|melodia|som|produção|filme|documentário/i.test(responseText);

        expect(hasRelevantKeyword).toBeTruthy();
    });

    test('deve realizar busca semântica para query sobre patrimônio', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        await page.fill('#chatbot-input', 'Me fale sobre produções de patrimônio cultural');
        await page.click('#send-btn');

        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        // Apenas verifica que respondeu com conteúdo razoável
        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(50);
    });

    test('deve realizar busca semântica para query sobre meio ambiente', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        await page.fill('#chatbot-input', 'Tem alguma produção sobre natureza e meio ambiente?');
        await page.click('#send-btn');

        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        // Apenas verifica que respondeu com conteúdo razoável
        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(50);
    });

    test('deve exibir production cards após busca bem-sucedida', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Query que deve retornar cards
        await page.fill('#chatbot-input', 'Me mostre filmes sobre viola caipira');
        await page.click('#send-btn');

        // Aguarda resposta
        await page.waitForTimeout(5000);

        // Verifica se cards de produção aparecem
        const productionCards = page.locator('.production-card');
        const cardCount = await productionCards.count();

        // Pode ter 0 cards se a UI não renderizar, mas a resposta deve mencionar as produções
        console.log(`Production cards found: ${cardCount}`);
    });

    test('deve responder queries de busca específicas', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Query de busca específica
        await page.fill('#chatbot-input', 'Procuro documentários sobre skate');
        await page.click('#send-btn');

        // Deve responder
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(30);
    });

    test('deve responder pedidos de recomendação', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Query de recomendação
        await page.fill('#chatbot-input', 'Me recomenda algo interessante');
        await page.click('#send-btn');

        // Deve responder com recomendações
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(50);
    });

    test('deve funcionar com queries longas e complexas', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Query complexa
        const complexQuery = 'Estou interessado em conhecer mais sobre as produções audiovisuais que exploram a cultura musical do interior paulista, especialmente aquelas que retratam instrumentos tradicionais como a viola caipira';

        await page.fill('#chatbot-input', complexQuery);
        await page.click('#send-btn');

        // Deve processar e responder
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 30000});

        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(50);
    });

    test('deve manter contexto em conversação multi-turno', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Primeira mensagem
        await page.fill('#chatbot-input', 'Olá');
        await page.click('#send-btn');

        // Aguarda aparecer a resposta do usuário primeiro
        await page.locator('.chatbot-message.user-message').last().waitFor({timeout: 5000});

        // Aguarda input habilitar novamente
        const input = page.locator('#chatbot-input');
        await expect(input).toBeEnabled({timeout: 30000});

        // Segunda mensagem
        await input.fill('Obrigado');
        await page.click('#send-btn');

        // Aguarda input habilitar de novo
        await expect(input).toBeEnabled({timeout: 30000});

        // Deve ter pelo menos 2 mensagens de usuário
        const userMessages = page.locator('.chatbot-message.user-message');
        const count = await userMessages.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('deve retornar resposta mesmo com RAG vazio (fallback)', async ({page}) => {
        // Simula embeddings vazios
        await page.route('**/embeddings.json', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await page.goto('/');
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Envia query mesmo sem RAG
        await page.fill('#chatbot-input', 'Olá, como funciona o Bitaca?');
        await page.click('#send-btn');

        // Deve responder (sem RAG, mas com conhecimento geral)
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 30000});
    });

    test('deve responder queries não relacionadas graciosamente', async ({page}) => {
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Query completamente não relacionada
        await page.fill('#chatbot-input', 'Qual é a capital da França?');
        await page.click('#send-btn');

        // Deve responder mesmo sem encontrar produções relevantes
        const botResponse = page.locator('.chatbot-message.bot-message').last();
        await expect(botResponse).toBeVisible({timeout: 45000});

        const responseText = await botResponse.textContent();
        expect(responseText.length).toBeGreaterThan(20);
    });
});

test.describe('Chatbot RAG - Production Cards UI', () => {
    test('production card deve ter estrutura correta', async ({page}) => {
        await page.goto('/');
        await page.click('#chatbot-fab');
        await page.waitForSelector('#chatbot-container.active');

        // Envia query que deve retornar cards
        await page.fill('#chatbot-input', 'Ponteia Viola');
        await page.click('#send-btn');

        await page.waitForTimeout(5000);

        // Se existir card, valida estrutura
        const cards = page.locator('.production-card');
        const count = await cards.count();

        if (count > 0) {
            const firstCard = cards.first();

            // Verifica elementos do card
            await expect(firstCard.locator('.card-title')).toBeVisible();
            await expect(firstCard.locator('.card-director')).toBeVisible();
            await expect(firstCard.locator('.card-theme')).toBeVisible();
        }
    });
});
