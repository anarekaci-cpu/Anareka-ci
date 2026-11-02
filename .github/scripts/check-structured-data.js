#!/usr/bin/env node
'use strict';

/*
 * JSON-LD et métadonnées de partage :
 *  - chaque bloc JSON-LD est du JSON valide avec @context
 *  - toute URL https://anarekaci.com/... du JSON-LD correspond à un fichier du dépôt
 *  - pages : canonical == og:url == URL publique du fichier
 *  - articles : mainEntityOfPage == canonical, dates ISO, datePublished <= dateModified,
 *    og:image présent sur disque
 */

const { SITE, findHtmlFiles, readPage, jsonLd, existsOnSite, isArticle, report } = require('./lib/pages');

const problems = [];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function attr(root, sel, name) {
  const el = root.querySelector(sel);
  return el ? el.getAttribute(name) : null;
}

// JSON.parse garde silencieusement la dernière valeur d'une clé répétée, mais Google
// rejette l'objet ("Propriété en double"). On relit donc le texte brut du bloc.
function duplicateKeys(text) {
  const dups = [];
  const stack = []; // une entrée par objet/tableau ouvert : Set des clés, ou null pour un tableau
  const re = /"(?:[^"\\]|\\.)*"|[{}[\]:]/g;
  let m;
  let prev = null;
  while ((m = re.exec(text))) {
    const t = m[0];
    if (t === '{') stack.push(new Set());
    else if (t === '[') stack.push(null);
    else if (t === '}' || t === ']') stack.pop();
    else if (t === ':' && prev && prev[0] === '"') {
      const keys = stack[stack.length - 1];
      const key = JSON.parse(prev);
      if (keys) {
        if (keys.has(key)) dups.push(key);
        keys.add(key);
      }
    }
    prev = t;
  }
  return dups;
}

function walk(value, fn) {
  if (Array.isArray(value)) value.forEach((v) => walk(v, fn));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => walk(v, fn));
  else if (typeof value === 'string') fn(value);
}

for (const file of findHtmlFiles()) {
  const page = readPage(file);
  const r = page.rel;
  if (r === '404.html') continue;

  let blocks;
  try {
    blocks = jsonLd(page);
  } catch (e) {
    problems.push(e.message);
    continue;
  }
  page.root.querySelectorAll('script[type="application/ld+json"]').forEach((el, i) => {
    for (const k of duplicateKeys(el.text)) {
      problems.push(`${r} : bloc JSON-LD n°${i + 1}, propriété "${k}" en double dans le même objet`);
    }
  });
  blocks.forEach((b, i) => {
    if (!b['@context']) problems.push(`${r} : bloc JSON-LD n°${i + 1} sans @context`);
    walk(b, (s) => {
      if (!s.startsWith(SITE + '/') || s === SITE + '/') return;
      const p = s.slice(SITE.length);
      if (!existsOnSite(p)) problems.push(`${r} : le JSON-LD référence ${s}, introuvable dans le dépôt`);
    });
  });

  const canonical = attr(page.root, 'link[rel="canonical"]', 'href');
  const ogUrl = attr(page.root, 'meta[property="og:url"]', 'content');
  const expected = SITE + page.url;
  if (canonical !== expected) problems.push(`${r} : canonical "${canonical}", attendu "${expected}"`);
  if (ogUrl !== expected) problems.push(`${r} : og:url "${ogUrl}", attendu "${expected}"`);

  const ogImage = attr(page.root, 'meta[property="og:image"]', 'content');
  if (ogImage && ogImage.startsWith(SITE + '/') && !existsOnSite(ogImage.slice(SITE.length))) {
    problems.push(`${r} : og:image ${ogImage} introuvable`);
  }

  if (isArticle(file)) {
    const post = blocks.find((b) => b['@type'] === 'BlogPosting');
    if (!post) { problems.push(`${r} : pas de BlogPosting`); continue; }
    const main = post.mainEntityOfPage && (post.mainEntityOfPage['@id'] || post.mainEntityOfPage);
    if (main !== canonical) problems.push(`${r} : mainEntityOfPage "${main}" != canonical "${canonical}"`);
    if (!ISO.test(post.datePublished || '')) problems.push(`${r} : datePublished invalide`);
    if (post.dateModified && !ISO.test(post.dateModified)) problems.push(`${r} : dateModified invalide`);
    if (post.dateModified && post.datePublished > post.dateModified) problems.push(`${r} : dateModified antérieure à datePublished`);
    if (!attr(page.root, 'meta[property="og:image:alt"]', 'content')) problems.push(`${r} : og:image:alt manquant`);
  }
}

report('check-structured-data', problems, 'JSON-LD, canonical et og:url cohérents.');
