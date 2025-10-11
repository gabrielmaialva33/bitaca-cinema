const { test, expect } = require('@playwright/test');

const SITE_URL = 'https://gabrielmaialva33.github.io/bitaca-cinema/';
const LOCAL_URL = 'http://localhost:8000';
const BASE_URL = process.env.TEST_ENV === 'production' ? SITE_URL : LOCAL_URL;

test.describe('Responsividade GitHub Pages', () => {
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    test(`${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const section = page.locator('#depoimentos');
      await expect(section).toBeVisible();

      await page.screenshot({
        path: `tests/screenshots/${vp.name.toLowerCase()}.png`,
        fullPage: true
      });
    });
  }
});

test.describe('Funcionalidade Video Recorder', () => {
  test('deve abrir modal ao clicar em Iniciar Gravação', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await context.grantPermissions(['camera', 'microphone']);

    await page.locator('#depoimentos').scrollIntoViewIfNeeded();
    await page.click('[data-action="open-recorder"]');

    await page.waitForSelector('#recorder-modal.active', { timeout: 5000 });

    const modal = page.locator('#recorder-modal');
    await expect(modal).toHaveClass(/active/);
  });

  test('deve fechar modal ao clicar no X', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await context.grantPermissions(['camera', 'microphone']);

    await page.click('[data-action="open-recorder"]');
    await page.waitForSelector('#recorder-modal.active');

    await page.click('[data-action="close-recorder"]');
    await page.waitForTimeout(500);

    const modal = page.locator('#recorder-modal');
    await expect(modal).not.toHaveClass(/active/);
  });

  test('deve iniciar câmera', async ({ page, context }) => {
    await page.goto(BASE_URL);
    await context.grantPermissions(['camera', 'microphone']);

    await page.click('[data-action="open-recorder"]');
    await page.waitForSelector('#recorder-modal.active');

    await page.click('#btn-start-camera');
    await page.waitForSelector('[data-state="ready"]', { timeout: 5000 });

    const video = page.locator('#camera-preview');
    await expect(video).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('deve carregar em menos de 3 segundos', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    console.log(`Tempo de carregamento: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});
