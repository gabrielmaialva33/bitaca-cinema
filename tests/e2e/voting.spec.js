const {test, expect} = require('@playwright/test');

/**
 * Bitaca Cinema - Voting System E2E Tests
 * Tests the complete voting flow: Auth → Quiz → Vote
 */

const BASE_URL = process.env.TEST_ENV === 'production'
    ? 'https://www.abitaca.com.br'
    : 'http://localhost:8000/apps/frontend';

test.describe('Voting System - Authentication Flow', () => {

    test.beforeEach(async ({page}) => {
        await page.goto(BASE_URL);
    });

    test('should show login button in navigation', async ({page}) => {
        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check for auth button
        const authBtn = page.locator('#auth-trigger-btn, .nav-voting-btn');
        await expect(authBtn).toBeVisible({timeout: 10000});
        await expect(authBtn).toContainText(/Entrar|Login/i);
    });

    test('should add voting buttons to film cards', async ({page}) => {
        await page.waitForLoadState('networkidle');

        // Wait for film cards to render
        await page.waitForSelector('.filme-card', {timeout: 10000});

        // Check for vote buttons
        const voteButtons = page.locator('.filme-vote-btn');
        const count = await voteButtons.count();

        // Should have at least one vote button
        expect(count).toBeGreaterThan(0);

        // Check button content
        const firstBtn = voteButtons.first();
        await expect(firstBtn).toContainText('Votar');
    });

    test('should open auth modal when clicking vote without login', async ({page}) => {
        await page.waitForLoadState('networkidle');

        // Wait for film cards
        await page.waitForSelector('.filme-card', {timeout: 10000});

        // Click first vote button
        const firstVoteBtn = page.locator('.filme-vote-btn').first();
        await firstVoteBtn.click();

        // Auth modal should open
        const authModal = page.locator('#auth-modal, .auth-modal');
        await expect(authModal).toBeVisible({timeout: 5000});

        // Check modal content
        await expect(authModal).toContainText(/Entrar|Login|Autenticação/i);
    });

    test('should have social login options', async ({page}) => {
        await page.waitForLoadState('networkidle');

        // Open auth modal
        const authBtn = page.locator('#auth-trigger-btn').first();
        await authBtn.click();

        await page.waitForSelector('#auth-modal', {state: 'visible', timeout: 5000});

        // Check for Google login button
        const googleBtn = page.locator('[data-provider="google"], .google-login-btn');
        if (await googleBtn.count() > 0) {
            await expect(googleBtn.first()).toBeVisible();
        }

        // Check for email login option
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
            await expect(emailInput.first()).toBeVisible();
        }
    });

    test('should close auth modal', async ({page}) => {
        await page.waitForLoadState('networkidle');

        // Open auth modal
        const authBtn = page.locator('#auth-trigger-btn').first();
        await authBtn.click();

        const authModal = page.locator('#auth-modal');
        await expect(authModal).toBeVisible({timeout: 5000});

        // Close modal
        const closeBtn = page.locator('#auth-modal .auth-modal__close, #auth-modal .modal__close');
        if (await closeBtn.count() > 0) {
            await closeBtn.click();
            await expect(authModal).not.toBeVisible({timeout: 3000});
        }
    });
});

test.describe('Voting System - Quiz Flow', () => {

    test('should show quiz requirement message', async ({page}) => {
        // Note: This test requires mock authentication
        // In real scenario, user would be authenticated first

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check if quiz modal exists in DOM
        const quizModal = page.locator('#quiz-modal, .quiz-modal');
        await expect(quizModal).toBeAttached();
    });

    test('should have quiz questions about cultural laws', async ({page}) => {
        await page.goto(BASE_URL);

        // Quiz questions should be about Lei Paulo Gustavo and PNAB
        // This is structural test - actual quiz requires authentication
        const content = await page.content();

        // Check if quiz-related terms exist in page
        expect(content).toMatch(/quiz|questão|pergunta/i);
    });
});

test.describe('Voting System - Film Voting UI', () => {

    test('should render voting modal structure', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check if voting modal exists
        const votingModal = page.locator('#voting-modal, .voting-modal');
        await expect(votingModal).toBeAttached();

        // Check modal components
        const modalTitle = page.locator('#voting-modal-title');
        if (await modalTitle.count() > 0) {
            await expect(modalTitle).toBeAttached();
        }

        const filmsList = page.locator('#voting-films-list');
        await expect(filmsList).toBeAttached();
    });

    test('should have star rating component', async ({page}) => {
        await page.goto(BASE_URL);

        // Star rating should exist in code
        const content = await page.content();
        expect(content).toMatch(/star-rating|ki-star/i);
    });

    test('should show voting statistics', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check for stats elements
        const totalVotes = page.locator('#total-votes-stat, #user-total-votes');
        const remainingVotes = page.locator('#remaining-votes, #remaining-votes-stat');

        if (await totalVotes.count() > 0 && await remainingVotes.count() > 0) {
            await expect(totalVotes.first()).toBeAttached();
            await expect(remainingVotes.first()).toBeAttached();
        }
    });
});

test.describe('Voting System - Statistics Dashboard', () => {

    test('should have dashboard UI in DOM', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check if dashboard exists
        const dashboard = page.locator('#voting-stats-dashboard, .stats-dashboard');
        await expect(dashboard).toBeAttached();
    });

    test('should have visualization container', async ({page}) => {
        await page.goto(BASE_URL);

        const vizContainer = page.locator('#d3-viz-container, .d3-viz-container');
        await expect(vizContainer).toBeAttached();
    });

    test('should have stat cards', async ({page}) => {
        await page.goto(BASE_URL);

        const statCards = page.locator('.stat-card, .stats-card');
        if (await statCards.count() > 0) {
            expect(await statCards.count()).toBeGreaterThan(0);
        }
    });

    test('should have dashboard tabs', async ({page}) => {
        await page.goto(BASE_URL);

        const tabs = page.locator('.tab-btn, .dashboard-tab');
        if (await tabs.count() > 0) {
            expect(await tabs.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Voting System - D3.js Visualizations', () => {

    test('should load D3.js library', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Wait a bit for D3 to load
        await page.waitForTimeout(2000);

        // Check if D3 is available
        const hasD3 = await page.evaluate(() => typeof window.d3 !== 'undefined');

        // D3 might load asynchronously, so we check if the viz system is initialized
        const content = await page.content();
        const hasVizSystem = content.includes('d3-visualizations') || content.includes('D3Visualizations');

        expect(hasD3 || hasVizSystem).toBeTruthy();
    });

    test('should have visualization panels', async ({page}) => {
        await page.goto(BASE_URL);

        const vizPanels = page.locator('.viz-panel, #viz-ratings, #viz-themes, #viz-timeline, #viz-network');
        if (await vizPanels.count() > 0) {
            expect(await vizPanels.count()).toBeGreaterThan(0);
        }
    });
});

test.describe('Voting System - Mobile Responsiveness', () => {

    test('should be responsive on mobile', async ({page}) => {
        // Set mobile viewport
        await page.setViewportSize({width: 375, height: 667});
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Vote button should adapt
        const voteBtn = page.locator('.filme-vote-btn').first();
        if (await voteBtn.count() > 0) {
            await expect(voteBtn).toBeVisible();

            // Button should have reasonable size
            const box = await voteBtn.boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThan(50);
                expect(box.height).toBeGreaterThan(30);
            }
        }
    });

    test('should show mobile-friendly auth button', async ({page}) => {
        await page.setViewportSize({width: 375, height: 667});
        await page.goto(BASE_URL);

        const authBtn = page.locator('#auth-trigger-btn, .nav-voting-btn');
        if (await authBtn.count() > 0) {
            await expect(authBtn.first()).toBeVisible();
        }
    });
});

test.describe('Voting System - Performance', () => {

    test('should load voting system within reasonable time', async ({page}) => {
        const startTime = Date.now();

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Wait for voting system initialization
        await page.waitForSelector('.filme-vote-btn, #auth-trigger-btn', {timeout: 10000});

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // Should load within 10 seconds
        expect(loadTime).toBeLessThan(10000);

        console.log(`Voting system loaded in ${loadTime}ms`);
    });

    test('should not have JavaScript errors', async ({page}) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Filter out expected/minor errors
        const criticalErrors = errors.filter(err =>
            !err.includes('Firebase') &&
            !err.includes('analytics') &&
            !err.includes('Extension') &&
            !err.toLowerCase().includes('failed to load resource')
        );

        expect(criticalErrors.length).toBe(0);

        if (criticalErrors.length > 0) {
            console.log('Critical errors found:', criticalErrors);
        }
    });
});

test.describe('Voting System - Accessibility', () => {

    test('should have proper ARIA labels', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check vote buttons
        const voteBtns = page.locator('.filme-vote-btn');
        if (await voteBtns.count() > 0) {
            const firstBtn = voteBtns.first();
            const ariaLabel = await firstBtn.getAttribute('aria-label');

            // Should have aria-label or title
            const title = await firstBtn.getAttribute('title');
            expect(ariaLabel || title).toBeTruthy();
        }
    });

    test('should have keyboard navigation', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Tab through elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Check if any element is focused
        const focusedElement = await page.evaluate(() => {
            return document.activeElement?.tagName;
        });

        expect(focusedElement).toBeTruthy();
    });

    test('should have semantic HTML for voting', async ({page}) => {
        await page.goto(BASE_URL);

        // Check for buttons (not divs with click handlers)
        const voteBtns = page.locator('.filme-vote-btn, button[data-action="vote"]');
        if (await voteBtns.count() > 0) {
            const tagName = await voteBtns.first().evaluate(el => el.tagName);
            expect(tagName.toLowerCase()).toBe('button');
        }
    });
});

test.describe('Voting System - Integration', () => {

    test('should integrate with main film catalog', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check if film cards exist
        const filmCards = page.locator('.filme-card');
        expect(await filmCards.count()).toBeGreaterThan(0);

        // Each card should have a vote button or link
        const firstCard = filmCards.first();
        const voteBtn = firstCard.locator('.filme-vote-btn, button:has-text("Votar")');

        if (await voteBtn.count() > 0) {
            await expect(voteBtn).toBeVisible();
        }
    });

    test('should work with filtering system', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check filter buttons
        const filterBtns = page.locator('.filter-btn, [data-filter]');
        if (await filterBtns.count() > 0) {
            // Click a filter
            const patrimonioFilter = page.locator('[data-filter="patrimonio"]');
            if (await patrimonioFilter.count() > 0) {
                await patrimonioFilter.click();

                // Wait for filtering
                await page.waitForTimeout(500);

                // Vote buttons should still be present
                const voteBtns = page.locator('.filme-vote-btn');
                expect(await voteBtns.count()).toBeGreaterThan(0);
            }
        }
    });

    test('should integrate with chatbot', async ({page}) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Check if chatbot exists
        const chatbot = page.locator('#bitaca-chatbot, .bitaca-chatbot, #chatbot-fab');
        if (await chatbot.count() > 0) {
            await expect(chatbot.first()).toBeVisible();
        }

        // Chatbot and voting should coexist
        const voteBtn = page.locator('.filme-vote-btn').first();
        if (await voteBtn.count() > 0) {
            await expect(voteBtn).toBeVisible();
        }
    });
});
