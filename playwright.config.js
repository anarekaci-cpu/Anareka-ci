// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// tests/serve.js applique _headers (CSP comprise) et les URLs propres comme Cloudflare Pages :
// un script bloqué par la CSP fait donc échouer les tests. (Pas de wrangler : workerd ne démarre pas sur le runner CI.)
const PORT = 8788;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // En local on réutilise Chrome installé ; en CI on installe Chromium (voir ci.yml).
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'chrome' }) }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: 'chrome' }) }, grep: /@mobile/ },
  ],
  webServer: {
    command: `node tests/serve.js ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
