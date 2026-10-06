#!/usr/bin/env node
'use strict';

/*
 * Règles de contenu de CLAUDE.md, vérifiées page par page :
 *  - chemins racine-absolus (jamais ../ ni relatifs) pour href/src/srcset/poster
 *  - aucun lien interne en .html
 *  - toute <img> a un alt et des width/height numériques
 *  - aucun emoji brut dans le texte (utiliser /emoji/*.svg)
 *  - <img class="emo"> : alt="" et parent aria-hidden="true"
 *  - une seule <h1>, pas de saut de niveau de titre, <html lang> cohérent,
 *    <title> et meta description non vides et uniques
 *  - liens target="_blank" avec rel noopener
 *  - iframe avec title
 */

const { findHtmlFiles, readPage, jsonLd, report, rel } = require('./lib/pages');

const problems = [];
const titles = new Map();
const descs = new Map();

// © et ® sont "Extended_Pictographic" mais légitimes dans le texte.
const EMOJI = /(?![©®])(\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
// Hôtes externes qui ne servent pas HTTPS (vérifié) : http:// toléré, un par un.
const HTTP_ALLOWED = ['siege.oapi.int'];
const ALLOWED_SCHEMES = /^(\/(?!\/)|#|https:|mailto:|tel:|data:)/;

function checkUrl(page, el, attr, value) {
  const v = value.trim();
  if (!v) return;
  if (v.startsWith('http://') &&HTTP_ALLOWED.includes(new URL(v).hostname)) return;
  if (!ALLOWED_SCHEMES.test(v)) {
    problems.push(`${page.rel} : ${attr}="${v}" n'est pas racine-absolu (utiliser /chemin)`);
    return;
  }
  const internal = v.startsWith('/') || v.startsWith('https://anarekaci.com');
  if (internal && /\.html(?:[#?]|$)/.test(v)) problems.push(`${page.rel} : lien interne en .html : ${v}`);
}

for (const file of findHtmlFiles()) {
  const page = readPage(file);
  const { root, rel: r } = page;
  const isStandalone = r === '404.html';

  // --- URLs
  root.querySelectorAll('[href]').forEach((el) => {
    if (el.tagName === 'A' || el.tagName === 'LINK') checkUrl(page, el, 'href', el.getAttribute('href'));
  });
  root.querySelectorAll('[src]').forEach((el) => checkUrl(page, el, 'src', el.getAttribute('src')));
  root.querySelectorAll('[srcset]').forEach((el) => {
    el.getAttribute('srcset').split(',').forEach((c) => checkUrl(page, el, 'srcset', c.trim().split(/\s+/)[0]));
  });

  // --- images
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '?';
    // Logo de l'overlay (dimensionné en CSS, aria-hidden) et pixels de substitution data: : exemptés.
    if (src.startsWith('data:') || img.closest('.lottie-overlay')) return;
    if (!img.hasAttribute('alt')) problems.push(`${r} : <img src="${src}"> sans attribut alt`);
    if (!/^\d+$/.test(img.getAttribute('width') || '') || !/^\d+$/.test(img.getAttribute('height') || '')) {
      problems.push(`${r} : <img src="${src}"> sans width/height numériques (CLS)`);
    }
    if ((img.getAttribute('class') || '').split(/\s+/).includes('emo')) {
      if (img.getAttribute('alt') !== '') problems.push(`${r} : <img class="emo" src="${src}"> doit avoir alt=""`);
      const hidden = img.parentNode && img.parentNode.getAttribute && img.parentNode.getAttribute('aria-hidden') === 'true';
      if (!hidden) problems.push(`${r} : <img class="emo" src="${src}"> doit être dans un parent aria-hidden="true"`);
    }
  });

  // --- emoji bruts (texte visible uniquement, hors script/style)
  const body = root.querySelector('body');
  if (body) {
    const clone = body.clone();
    clone.querySelectorAll('script, style').forEach((n) => n.remove());
    const m = clone.text.match(EMOJI);
    if (m) problems.push(`${r} : emoji brut « ${m[0]} » dans le texte (utiliser /emoji/*.svg)`);
  }

  // --- liens externes
  root.querySelectorAll('a[target="_blank"]').forEach((a) => {
    if (!/\bnoopener\b/.test(a.getAttribute('rel') || '')) problems.push(`${r} : lien target="_blank" sans rel="noopener" (${a.getAttribute('href')})`);
  });
  root.querySelectorAll('iframe').forEach((f) => {
    if (!f.getAttribute('title')) problems.push(`${r} : <iframe> sans title`);
  });

  if (isStandalone) continue;

  // --- structure
  const lang = root.querySelector('html') && root.querySelector('html').getAttribute('lang');
  const expected = r.startsWith('en/') ? 'en' : 'fr';
  if (lang !== expected) problems.push(`${r} : <html lang="${lang}">, attendu "${expected}"`);

  const h1 = root.querySelectorAll('h1');
  if (h1.length !== 1) problems.push(`${r} : ${h1.length} <h1> (attendu : 1)`);
  let prev = 0;
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const lvl = Number(h.tagName[1]);
    if (prev && lvl > prev + 1) problems.push(`${r} : saut de titre h${prev} → h${lvl} (« ${h.text.trim().slice(0, 40)} »)`);
    prev = lvl;
  });

  const title = (root.querySelector('title') || { text: '' }).text.trim();
  const desc = ((root.querySelector('meta[name="description"]') || { getAttribute: () => '' }).getAttribute('content') || '').trim();
  if (!title) problems.push(`${r} : <title> vide`);
  if (!desc) problems.push(`${r} : meta description vide`);
  if (title) { if (titles.has(title)) problems.push(`${r} : <title> identique à ${titles.get(title)}`); else titles.set(title, r); }
  if (desc) { if (descs.has(desc)) problems.push(`${r} : meta description identique à ${descs.get(desc)}`); else descs.set(desc, r); }

  // --- URLs internes dans le JSON-LD
  try {
    JSON.stringify(jsonLd(page), (k, v) => {
      if (typeof v === 'string' && /^https:\/\/anarekaci\.com\/.*\.html(?:[#?]|$)/.test(v)) problems.push(`${r} : URL en .html dans le JSON-LD : ${v}`);
      return v;
    });
  } catch (e) {
    problems.push(e.message);
  }
}

report('check-content', problems, 'Contenu conforme (chemins, images, emojis, titres, liens).');
