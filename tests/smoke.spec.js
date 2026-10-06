// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** Pages publiques : "index.html" -> "/", "x/index.html" -> "/x", "blog/a.html" -> "/blog/a" */
function pageUrls() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || ['node_modules', 'templates', 'tests'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html') && !e.name.startsWith('google') && e.name !== '404.html') {
        const r = path.relative(ROOT, full).replace(/\\/g, '/');
        out.push(r === 'index.html' ? '/' : r.endsWith('/index.html') ? '/' + r.slice(0, -11) : '/' + r.replace(/\.html$/, ''));
      }
    }
  })(ROOT);
  return out;
}

// Ne jamais envoyer de vraie demande d'adhésion pendant les tests.
test.beforeEach(async ({ page }) => {
  await page.route('https://formspree.io/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
});

test.describe('toutes les pages', () => {
  for (const url of pageUrls()) {
    test(`${url} : se charge sans erreur ni violation CSP`, async ({ page }) => {
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
      });
      const res = await page.goto(url);
      expect(res && res.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('formulaire d\'adhésion', () => {
  const cases = [
    ['/adhesion', 'Indiquez votre prénom et votre nom.'],
    ['/en/adhesion', 'Enter your first and last name.'],
  ];
  for (const [url, message] of cases) {
    test(`${url} : erreurs de saisie lisibles puis envoi`, async ({ page }) => {
      await page.goto(url);
      await page.locator('#adhesionForm .form-submit').click();
      await expect(page.locator('.form-error-summary')).not.toBeEmpty();
      await expect(page.locator('.field-error').first()).toHaveText(message);
      await expect(page.locator('#f-nom')).toHaveAttribute('aria-invalid', 'true');

      await page.fill('#f-nom', 'Kouassi Marie');
      await page.fill('#f-tel', '+225 07 00 00 00 00');
      await page.fill('#f-ville', 'Abidjan');
      await page.selectOption('#f-activite', { index: 1 });
      await page.locator('#adhesionForm .form-submit').click();
      await expect(page.locator('#formSuccess')).toBeVisible();
    });
  }
});

test('lightbox : ouverture, fond inerte, Échap rend le focus', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.train-card[tabindex="0"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#lightbox')).toHaveClass(/open/);
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).not.toHaveClass(/open/);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await expect(card).toBeFocused();
});

test('pause des animations : classe posée et mémorisée', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.motion-toggle');
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/motion-off/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/motion-off/);
});

test('mouvement réduit : le sceau de transition n\'est pas affiché', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#lottie-overlay')).toBeHidden();
});

test('changement de langue : /adhesion <-> /en/adhesion', async ({ page }) => {
  await page.goto('/adhesion');
  await page.locator('.lang-switch a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/adhesion\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('menu mobile : s\'ouvre, se ferme avec Échap @mobile', async ({ page }) => {
  await page.goto('/');
  await page.locator('#navToggle').click();
  await expect(page.locator('#navLinks')).toHaveClass(/open/);
  await expect(page.locator('#navLinks a').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#navLinks')).not.toHaveClass(/open/);
  await expect(page.locator('#navToggle')).toBeFocused();
});

test('aucun emoji surdimensionné (accueil FR et EN)', async ({ page }) => {
  for (const url of ['/', '/en/']) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const tooBig = await page.evaluate(() => [...document.querySelectorAll('img.emo')].map((i) => {
      const b = i.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(i.parentElement).fontSize);
      return { src: i.getAttribute('src'), w: Math.round(b.width), max: Math.max(48, fs * 2.4) };
    }).filter((x) => x.w > x.max));
    expect(tooBig, url).toEqual([]);
  }
});
