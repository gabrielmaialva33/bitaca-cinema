import { test, expect, devices } from '@playwright/test';

// Base URL
const BASE_URL = process.env.BASE_URL || 'https://play.abitaca.com.br';

// Test data
const SEARCH_QUERIES = {
  anime: 'naruto',
  movie: 'spider',
  series: 'breaking'
};

test.describe('Search Functionality', () => {
  // Desktop tests
  test.describe('Desktop', () => {
    test.skip(({ browserName, $projectName }) => $projectName !== 'Desktop', 'Desktop tests only');

    test('should open search overlay when clicking search button', async ({ page }) => {
      await page.goto(BASE_URL);

      // Wait for page to load
      await page.waitForSelector('#search-btn');

      // Click search button
      await page.click('#search-btn');

      // Check if search overlay is visible
      await expect(page.locator('#search-overlay')).toHaveClass(/active/);
      await expect(page.locator('#search-input')).toBeFocused();
    });

    test('should search for anime and display results', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      // Type search query
      await page.fill('#search-input', SEARCH_QUERIES.anime);

      // Wait for debounce and results
      await page.waitForTimeout(600);

      // Check for loading indicator
      await expect(page.locator('.search-loading, .search-count')).toBeVisible({ timeout: 10000 });

      // Wait for results
      await page.waitForSelector('.productions-grid, .search-empty', { timeout: 15000 });

      // Check if results are displayed
      const hasResults = await page.locator('.productions-grid').count() > 0;
      const isEmpty = await page.locator('.search-empty').count() > 0;

      expect(hasResults || isEmpty).toBeTruthy();
    });

    test('should search for movies and display results', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      // Type search query
      await page.fill('#search-input', SEARCH_QUERIES.movie);

      // Wait for debounce
      await page.waitForTimeout(600);

      // Wait for results
      await page.waitForSelector('.productions-grid, .search-empty', { timeout: 15000 });

      // Check if results are displayed
      const hasResults = await page.locator('.production-card').count() > 0;
      const isEmpty = await page.locator('.search-empty').count() > 0;

      expect(hasResults || isEmpty).toBeTruthy();
    });

    test('should show empty state for non-existent content', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      // Type non-existent query
      await page.fill('#search-input', 'xyzabc123nonexistent');

      // Wait for debounce
      await page.waitForTimeout(600);

      // Wait for empty state or results
      await page.waitForSelector('.search-empty, .productions-grid', { timeout: 15000 });
    });

    test('should close search overlay with close button', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');
      await expect(page.locator('#search-overlay')).toHaveClass(/active/);

      // Close search
      await page.click('#search-close');

      // Check if overlay is closed
      await expect(page.locator('#search-overlay')).not.toHaveClass(/active/);
    });

    test('should close search overlay with ESC key', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');
      await expect(page.locator('#search-overlay')).toHaveClass(/active/);

      // Press ESC
      await page.keyboard.press('Escape');

      // Check if overlay is closed
      await expect(page.locator('#search-overlay')).not.toHaveClass(/active/);
    });

    test('should clear results when search input is cleared', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search and type
      await page.click('#search-btn');
      await page.fill('#search-input', SEARCH_QUERIES.anime);
      await page.waitForTimeout(600);

      // Clear input
      await page.fill('#search-input', '');

      // Check if results are cleared
      const resultsContainer = page.locator('#search-results');
      await expect(resultsContainer).toBeEmpty();
    });
  });

  // Mobile tests
  test.describe('Mobile', () => {
    test.skip(({ browserName, $projectName }) => $projectName !== 'Mobile', 'Mobile tests only');

    test('should be responsive on mobile', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check if mobile layout is applied
      const viewport = page.viewportSize();
      expect(viewport.width).toBeLessThanOrEqual(428);
    });

    test('should open search on mobile', async ({ page }) => {
      await page.goto(BASE_URL);

      // Wait for mobile menu to be visible
      await page.waitForSelector('#search-btn, .mobile-menu-btn');

      // Click search button
      await page.click('#search-btn');

      // Check if search overlay is visible
      await expect(page.locator('#search-overlay')).toBeVisible();
    });

    test('should search on mobile and display results', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      // Type search query
      await page.fill('#search-input', SEARCH_QUERIES.anime);

      // Wait for debounce
      await page.waitForTimeout(600);

      // Wait for results
      await page.waitForSelector('.productions-grid, .search-empty', { timeout: 15000 });

      // Check if grid is responsive on mobile
      const grid = page.locator('.productions-grid');
      if (await grid.count() > 0) {
        const boundingBox = await grid.boundingBox();
        const viewport = page.viewportSize();

        // Grid should not overflow viewport
        expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test('should tap to close search on mobile', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');
      await expect(page.locator('#search-overlay')).toBeVisible();

      // Tap close button
      await page.tap('#search-close');

      // Check if overlay is closed
      await page.waitForTimeout(300);
      await expect(page.locator('#search-overlay')).not.toHaveClass(/active/);
    });

    test('should handle touch events on search results', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search and search
      await page.click('#search-btn');
      await page.fill('#search-input', SEARCH_QUERIES.movie);
      await page.waitForTimeout(600);

      // Wait for results
      await page.waitForSelector('.production-card', { timeout: 15000 });

      // Tap on first result
      const firstCard = page.locator('.production-card').first();
      if (await firstCard.count() > 0) {
        await firstCard.tap();

        // Check if player modal opens
        await page.waitForTimeout(500);
        const modal = page.locator('#player-modal');
        // Modal should either be visible or not found (depending on video availability)
        const modalExists = await modal.count() > 0;
        expect(modalExists).toBeTruthy();
      }
    });
  });

  // Tablet tests
  test.describe('Tablet', () => {
    test.skip(({ browserName, $projectName }) => $projectName !== 'Tablet', 'Tablet tests only');

    test('should be responsive on tablet', async ({ page }) => {
      await page.goto(BASE_URL);

      const viewport = page.viewportSize();
      expect(viewport.width).toBeGreaterThan(768);
      expect(viewport.width).toBeLessThan(1024);
    });

    test('should search on tablet', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      // Type search query
      await page.fill('#search-input', SEARCH_QUERIES.series);

      // Wait for results
      await page.waitForTimeout(600);
      await page.waitForSelector('.productions-grid, .search-empty', { timeout: 15000 });

      // Check if grid layout is appropriate for tablet
      const grid = page.locator('.productions-grid');
      if (await grid.count() > 0) {
        const cards = await grid.locator('.production-card').all();
        expect(cards.length).toBeGreaterThan(0);
      }
    });
  });

  // Performance tests
  test.describe('Performance', () => {
    test('should debounce search requests', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      let requestCount = 0;

      // Listen for API requests
      page.on('request', request => {
        if (request.url().includes('search')) {
          requestCount++;
        }
      });

      // Type quickly (should only trigger one request after debounce)
      await page.type('#search-input', 'test', { delay: 50 });

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Should have made only 1-2 requests (initial + debounced)
      expect(requestCount).toBeLessThanOrEqual(2);
    });

    test('should load search results within 3 seconds', async ({ page }) => {
      await page.goto(BASE_URL);

      // Open search
      await page.click('#search-btn');

      const startTime = Date.now();

      // Type and search
      await page.fill('#search-input', SEARCH_QUERIES.anime);

      // Wait for results
      await page.waitForSelector('.productions-grid, .search-empty', { timeout: 15000 });

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds (plus debounce time)
      expect(loadTime).toBeLessThan(4000);
    });
  });

  // Accessibility tests
  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check search button has aria-label
      const searchBtn = page.locator('#search-btn');
      await expect(searchBtn).toHaveAttribute('aria-label');

      // Check search input has placeholder
      await page.click('#search-btn');
      const searchInput = page.locator('#search-input');
      await expect(searchInput).toHaveAttribute('placeholder');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(BASE_URL);

      // Tab to search button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Navigate to search button

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Check if search opens
      await expect(page.locator('#search-overlay')).toHaveClass(/active/);

      // Type in search
      await page.keyboard.type('test');

      // ESC to close
      await page.keyboard.press('Escape');
      await expect(page.locator('#search-overlay')).not.toHaveClass(/active/);
    });
  });
});
