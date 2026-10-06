// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// wrangler pages dev applique _headers / _redirects comme en production :
// un script bloqué par la CSP fait donc échouer les tests.
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
    command: `npx --yes wrangler@4 pages dev . --port ${PORT} --compatibility-date=2026-05-01`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
