#!/usr/bin/env node
'use strict';

/*
 * Transforme templates/GUIDE-PUBLICATION-ARTICLE.md en contrôles :
 *  - index.html : .album-blog-list = exactement les 4 articles les plus récents, du plus récent au plus ancien
 *  - blog/index.html : .blog-card-featured = l'article le plus récent ; chaque article y figure une fois
 *  - .article-sidebar : 3 liens au plus, jamais vers l'article lui-même, tous résolus
 *  - catégorie (articleSection) : valeur connue (liste de CLAUDE.md)
 */

const path = require('path');
const { SITE, findHtmlFiles, readPage, jsonLd, urlOf, existsOnSite, isArticle, report } = require('./lib/pages');

// À tenir à jour avec CLAUDE.md. « Visite d'échanges » (avec s) est volontairement absent.
const CATEGORIES = [
  "Visite d'échange",
  'Patrimoine & Savoir-faire',
  'Nomination officielle',
  'Hygiène & Salubrité',
  'Partenariat',
];

const problems = [];
// Écarts constatés entre le guide et l'existant, signalés sans bloquer la CI
// (choix éditorial possible) : à trancher puis passer en erreur ou aligner le guide.
const warnings = [];
const articles = [];
for (const f of findHtmlFiles()) {
  if (!isArticle(f)) continue;
  const page = readPage(f);
  const post = jsonLd(page).find((b) => b['@type'] === 'BlogPosting');
  if (!post) { problems.push(`${page.rel} : pas de BlogPosting`); continue; }
  if (!CATEGORIES.includes(post.articleSection)) problems.push(`${page.rel} : catégorie inconnue « ${post.articleSection} »`);
  articles.push({ page, path: urlOf(f), date: post.datePublished });
}
// plus récent d'abord ; à date égale, ordre alphabétique inverse du slug pour rester déterministe
articles.sort((a, b) => b.date.localeCompare(a.date) || b.path.localeCompare(a.path));
const newest = articles.map((a) => a.path);
const hrefs = (nodes) => nodes.map((n) => (n.getAttribute('href') || '').replace(/\/$/, ''));

// index.html
{
  const home = readPage(path.join(__dirname, '..', '..', 'index.html'));
  const got = hrefs(home.root.querySelectorAll('.album-blog-list a.album-blog-card'));
  if (got.length !== 4) problems.push(`index.html : .album-blog-list contient ${got.length} cartes (attendu : 4)`);
  else {
    // à date égale l'ordre est libre : on compare les dates
    const dateOf = (p) => (articles.find((a) => a.path === p) || {}).date;
    const want4 = newest.slice(0, 4);
    if (new Set(got).size !== 4 || !got.every((p) => want4.includes(p) || dateOf(p) === dateOf(want4[3]))) {
      warnings.push(`index.html : .album-blog-list = [${got.join(', ')}], attendu les 4 plus récents [${want4.join(', ')}]`);
    }
    for (let i = 1; i < got.length; i++) if (dateOf(got[i]) > dateOf(got[i - 1])) warnings.push(`index.html : .album-blog-list pas triée du plus récent au plus ancien (${got[i]})`);
  }
}

// blog/index.html
{
  const idx = readPage(path.join(__dirname, '..', '..', 'blog', 'index.html'));
  const featured = hrefs(idx.root.querySelectorAll('a.blog-card-featured'));
  if (featured.length !== 1) problems.push(`blog/index.html : ${featured.length} .blog-card-featured (attendu : 1)`);
  else if (articles.length && articles.find((a) => a.path === featured[0]).date !== articles[0].date) {
    problems.push(`blog/index.html : l'article à la une (${featured[0]}) n'est pas le plus récent (${newest[0]})`);
  }
  const all = hrefs(idx.root.querySelectorAll('a.blog-card'));
  for (const p of newest) {
    const n = all.filter((h) => h === p).length;
    if (n !== 1) problems.push(`blog/index.html : ${p} apparaît ${n} fois (attendu : 1)`);
  }
}

// barres latérales
for (const a of articles) {
  const side = a.page.root.querySelector('.article-sidebar');
  if (!side) { problems.push(`${a.page.rel} : pas de .article-sidebar`); continue; }
  const links = hrefs(side.querySelectorAll('a.sidebar-post'));
  if (links.length > 3) warnings.push(`${a.page.rel} : ${links.length} liens dans la barre latérale (le guide en prévoit 3)`);
  links.forEach((h) => {
    if (h === a.path) problems.push(`${a.page.rel} : la barre latérale pointe vers l'article lui-même`);
    if (!existsOnSite(h)) problems.push(`${a.page.rel} : lien de barre latérale cassé ${h}`);
  });
}

warnings.forEach((w) => console.log(`::warning::${w}`));
report('check-blog-links', problems, 'Maillage du blog conforme au guide de publication.');
