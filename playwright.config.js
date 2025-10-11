const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,

  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['html', { outputFolder: 'tests/report' }], ['list']],

  use: {
    baseURL: process.env.TEST_ENV === 'production'
      ? 'https://gabrielmaialva33.github.io/bitaca-cinema/'
      : 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Tablet', use: { ...devices['iPad Pro'] } },
  ],

  webServer: process.env.TEST_ENV !== 'production' ? {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: true,
  } : undefined,
});
