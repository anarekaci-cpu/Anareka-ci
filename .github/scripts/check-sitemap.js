#!/usr/bin/env node
'use strict';

/*
 * sitemap.xml <-> fichiers, dans les deux sens :
 *  - chaque page du dépôt est dans le sitemap, chaque <loc> a un fichier
 *  - lastmod au format AAAA-MM-JJ, pas dans le futur
 *  - articles : juste après /blog, du plus récent au plus ancien,
 *    changefreq=monthly, priority=0.7
 *  - chaque image:loc existe
 */

const fs = require('fs');
const path = require('path');
const { ROOT, SITE, findHtmlFiles, readPage, jsonLd, urlOf, existsOnSite, isArticle, report } = require('./lib/pages');

const problems = [];
const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
  const b = m[1];
  const get = (t) => (b.match(new RegExp(`<${t}>([^<]*)</${t}>`)) || [])[1] || null;
  return { loc: get('loc'), lastmod: get('lastmod'), changefreq: get('changefreq'), priority: get('priority'), images: [...b.matchAll(/<image:loc>([^<]*)<\/image:loc>/g)].map((x) => x[1]) };
});

const locs = new Set(entries.map((e) => e.loc));
const today = new Date().toISOString().slice(0, 10);

// fichiers -> sitemap
const articles = [];
for (const f of findHtmlFiles()) {
  const url = SITE + urlOf(f);
  if (path.basename(f) === '404.html') continue;
  if (!locs.has(url)) problems.push(`page absente du sitemap : ${url}`);
  if (isArticle(f)) articles.push(url);
}
// sitemap -> fichiers
for (const e of entries) {
  if (!e.loc || !e.loc.startsWith(SITE)) { problems.push(`<loc> invalide : ${e.loc}`); continue; }
  const p = e.loc.slice(SITE.length) || '/';
  if (!existsOnSite(p)) problems.push(`<loc> sans fichier : ${e.loc}`);
  if (!e.lastmod || !/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod)) problems.push(`${e.loc} : lastmod invalide (${e.lastmod})`);
  else if (e.lastmod > today) problems.push(`${e.loc} : lastmod dans le futur (${e.lastmod})`);
  e.images.forEach((img) => {
    if (img.startsWith(SITE + '/') && !existsOnSite(img.slice(SITE.length))) problems.push(`${e.loc} : image:loc introuvable ${img}`);
  });
}

// articles : ordre (du plus récent au plus ancien par datePublished) et paramètres
const published = {};
for (const f of findHtmlFiles()) {
  if (!isArticle(f)) continue;
  const post = jsonLd(readPage(f)).find((b) => b['@type'] === 'BlogPosting');
  if (post) published[SITE + urlOf(f)] = post.datePublished;
}
const artEntries = entries.filter((e) => articles.includes(e.loc));
artEntries.forEach((e) => {
  if (e.changefreq !== 'monthly' || e.priority !== '0.7') problems.push(`${e.loc} : changefreq/priority attendus monthly/0.7`);
});
const blogIdx = entries.findIndex((e) => e.loc === SITE + '/blog');
if (blogIdx >= 0) {
  // /en/blog peut s'intercaler entre /blog et les articles
  const after = entries.slice(blogIdx + 1).filter((e) => e.loc !== SITE + '/en/blog');
  if (!after.slice(0, artEntries.length).every((e) => articles.includes(e.loc))) problems.push('les articles doivent suivre /blog (et /en/blog) dans le sitemap');
}
for (let i = 1; i < artEntries.length; i++) {
  if (published[artEntries[i].loc] > published[artEntries[i - 1].loc]) {
    problems.push(`ordre des articles : ${artEntries[i].loc} (publié ${published[artEntries[i].loc]}) devrait précéder ${artEntries[i - 1].loc} (publié ${published[artEntries[i - 1].loc]})`);
  }
}

report('check-sitemap', problems, 'Sitemap cohérent avec les fichiers.');
