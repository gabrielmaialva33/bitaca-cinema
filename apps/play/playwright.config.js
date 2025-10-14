const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,

    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,

    reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

    use: {
        baseURL: process.env.BASE_URL || 'https://play.abitaca.com.br',
        trace: 'on-first-retry',
        screenshot: {
            mode: 'only-on-failure',
            fullPage: false
        },
        video: 'retain-on-failure',
    },

    projects: [
        { name: 'Desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'Mobile', use: { ...devices['iPhone 13'] } },
        { name: 'Tablet', use: { ...devices['iPad Pro'] } },
    ],
});
