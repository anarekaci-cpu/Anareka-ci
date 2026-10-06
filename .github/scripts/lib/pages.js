'use strict';

/*
 * Utilitaires partagés par les garde-fous check-content / check-structured-data /
 * check-sitemap / check-blog-links / check-page-count.
 * (Les trois garde-fous historiques gardent leur propre copie : ne pas y toucher
 * sans raison, ils sont stables.)
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SITE = 'https://anarekaci.com';

function findHtmlFiles(dir = ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'templates' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('google')) out.push(full);
  }
  return out.sort();
}

/** chemin relatif au site, en "/" : "en/blog/index.html" */
function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

/** URL publique propre d'un fichier : "blog/x.html" -> "/blog/x", "en/index.html" -> "/en/" */
function urlOf(file) {
  const r = rel(file);
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) {
    const dir = '/' + r.slice(0, -'/index.html'.length);
    return dir === '/en' ? '/en/' : dir;
  }
  return '/' + r.replace(/\.html$/, '');
}

function readPage(file) {
  const html = fs.readFileSync(file, 'utf8');
  return { file, rel: rel(file), url: urlOf(file), html, root: parse(html) };
}

/** Vrai si l'URL publique ("/blog/x", "/en/", "/img.webp") correspond à un fichier du dépôt. */
function existsOnSite(urlPath) {
  const p = urlPath.split('#')[0].split('?')[0];
  if (p === '' || p === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const clean = p.replace(/^\//, '').replace(/\/$/, '');
  return [clean, clean + '.html', clean + '/index.html'].some((c) => {
    const full = path.join(ROOT, c);
    return fs.existsSync(full) && fs.statSync(full).isFile();
  });
}

/** Contenu JSON-LD parsé d'une page ; lève avec le nom du fichier si le JSON est invalide. */
function jsonLd(page) {
  return page.root.querySelectorAll('script[type="application/ld+json"]').map((el, i) => {
    try {
      return JSON.parse(el.text);
    } catch (e) {
      throw new Error(`${page.rel} : bloc JSON-LD n°${i + 1} invalide (${e.message})`);
    }
  });
}

function isArticle(file) {
  const r = rel(file);
  return /^blog\/[^/]+\.html$/.test(r) && r !== 'blog/index.html';
}

function report(name, problems, okMessage) {
  if (problems.length) {
    console.error(`${name} — ${problems.length} problème(s) :\n`);
    problems.forEach((p) => console.error('  ✗ ' + p));
    process.exit(1);
  }
  console.log(okMessage);
}

module.exports = { ROOT, SITE, findHtmlFiles, rel, urlOf, readPage, existsOnSite, jsonLd, isArticle, report };
