#!/usr/bin/env node
'use strict';

/*
 * Publie un article en appliquant la procédure de templates/GUIDE-PUBLICATION-ARTICLE.md :
 *  1. blog/{slug}.html créé depuis templates/article-template.html
 *  2. maillage : blog/index.html (à la une + grille + JSON-LD), accueil (4 cartes),
 *     barres latérales de tous les articles (3 plus récents hors eux-mêmes)
 *  3. entrée sitemap.xml
 * Reste à écrire : le corps de l'article (--body fichier.html, ou à la main ensuite).
 * Outil de développement uniquement : le site reste sans étape de build.
 *
 *   npm run new-article -- --slug mon-slug --title "Titre" --description "Résumé 140-160 car." \
 *     --category "Partenariat" --date 2026-10-21 --image hero.webp --alt "Alt de la photo" \
 *     [--caption "Légende"] [--emoji handshake] [--summary "Résumé de la carte du blog"] \
 *     [--seo-title "Titre SEO"] [--short-title "Titre court (accueil)"] [--keywords "a,b,c"] \
 *     [--body corps.html] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

const ROOT = path.join(__dirname, '..', '..');
const CATEGORIES = ["Visite d'échange", 'Patrimoine & Savoir-faire', 'Nomination officielle', 'Hygiène & Salubrité', 'Partenariat'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const die = (msg) => { console.error(`Erreur : ${msg}`); process.exit(1); };
const rel = (...p) => path.join(ROOT, ...p);
const read = (f) => fs.readFileSync(rel(f), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (s) => JSON.stringify(s).slice(1, -1);
const frDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`; };
const sub = (s, from, to) => { if (!s.includes(from)) die(`gabarit : « ${from.slice(0, 60)} » introuvable (gabarit modifié ?)`); return s.split(from).join(to); };

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) die(`argument inattendu « ${argv[i]} »`);
    const key = argv[i].slice(2);
    if (key === 'dry-run') { out.dryRun = true; continue; }
    if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) die(`--${key} attend une valeur`);
    out[key.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i];
  }
  return out;
}

// Dimensions réelles d'un .webp (VP8, VP8L ou VP8X) : évite le décalage de mise en page (CLS).
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') die(`${file} n'est pas un fichier .webp`);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  return die(`format .webp non reconnu dans ${file}`);
}

function articlesOnDisk() {
  const list = [];
  for (const f of fs.readdirSync(rel('blog'))) {
    if (!f.endsWith('.html') || f === 'index.html') continue;
    const html = read(`blog/${f}`);
    const root = parse(html);
    let post;
    for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
      try { const j = JSON.parse(s.text); if (j['@type'] === 'BlogPosting') post = j; } catch (_) { /* ignoré : check-structured-data le signale */ }
    }
    if (!post) die(`blog/${f} : pas de BlogPosting`);
    list.push({ slug: f.slice(0, -5), file: `blog/${f}`, date: post.datePublished, headline: post.headline, category: post.articleSection });
  }
  return list;
}
// plus récent d'abord ; à date égale, slug inverse (même ordre que check-blog-links)
const byRecency = (a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug);

function main() {
  const o = parseArgs(process.argv.slice(2));
  for (const k of ['slug', 'title', 'description', 'category', 'date', 'image', 'alt']) if (!o[k]) die(`--${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())} est obligatoire`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.slug)) die('slug : minuscules, chiffres et tirets uniquement, sans accents');
  if (!CATEGORIES.includes(o.category)) die(`catégorie inconnue « ${o.category} » — valeurs : ${CATEGORIES.join(' | ')}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date) || Number.isNaN(Date.parse(o.date))) die('--date au format AAAA-MM-JJ');
  if (fs.existsSync(rel('blog', `${o.slug}.html`))) die(`blog/${o.slug}.html existe déjà`);
  if (!fs.existsSync(rel(o.image))) die(`image introuvable à la racine du dépôt : ${o.image}`);
  const emoji = o.emoji || 'sheaf-of-rice';
  if (!fs.existsSync(rel('emoji', `${emoji}.svg`))) die(`emoji/${emoji}.svg introuvable (voir CLAUDE.md pour en ajouter un)`);
  if (o.description.length < 100 || o.description.length > 170) console.warn(`Attention : description de ${o.description.length} caractères (visé : 140-160).`);
  const seoTitle = o.seoTitle || `${o.title} | ANAREKA-CI`;
  if (seoTitle.length > 70) console.warn(`Attention : titre SEO de ${seoTitle.length} caractères (visé : 60-65).`);

  const dryRun = !!o.dryRun;
  const writes = new Map();
  const get = (f) => (writes.has(f) ? writes.get(f) : read(f));
  const put = (f, content) => writes.set(f, content);

  const { w, h } = webpSize(rel(o.image));
  const slug = o.slug;
  const url = `https://anarekaci.com/blog/${slug}`;
  const dateFr = frDate(o.date);
  const caption = o.caption || o.alt;
  const keywords = ['attiéké', ...(o.keywords ? o.keywords.split(',').map((s) => s.trim()).filter(Boolean) : []), 'ANAREKA-CI', "Côte d'Ivoire"];

  // ---- 1. blog/{slug}.html -------------------------------------------------
  let t = read('templates/article-template.html');
  const T = "Titre de l'article";
  t = sub(t, `"headline": "${T}"`, `"headline": "${json(o.title)}"`);
  t = sub(t, `"name": "${T}" }`, `"name": "${json(o.title)}" }`);
  t = sub(t, `<title>${T} | ANAREKA-CI</title>`, `<title>${esc(seoTitle)}</title>`);
  t = sub(t, T, esc(o.title));
  t = sub(t, "Résumé de l'article en une phrase, repris ensuite dans og:description et twitter:description.", esc(o.description));
  t = sub(t, "Résumé de l'article en une phrase.", esc(o.description));
  t = sub(t, 'slug-de-larticle', slug);
  t = sub(t, 'nom-image-hero.webp', o.image);
  t = sub(t, '<meta property="og:image:width" content="1200">', `<meta property="og:image:width" content="${w}">`);
  t = sub(t, '<meta property="og:image:height" content="630">', `<meta property="og:image:height" content="${h}">`);
  t = sub(t, "Description de l'image à la une (reprendre l'alt de la première image)", esc(o.alt));
  t = sub(t, 'Description factuelle et précise de la photo', esc(o.alt));
  t = sub(t, '"datePublished": "2026-01-01"', `"datePublished": "${o.date}"`);
  t = sub(t, '"dateModified": "2026-01-01"', `"dateModified": "${o.date}"`);
  t = sub(t, '"articleSection": "Catégorie"', `"articleSection": "${json(o.category)}"`);
  t = sub(t, /"keywords": \[[^\]]*\]/.exec(t)[0], `"keywords": [${keywords.map((k) => `"${json(k)}"`).join(', ')}]`);
  t = sub(t, '<time datetime="AAAA-MM-JJ"><!-- À REMPLACER : jj mois aaaa --></time>', `<time datetime="${o.date}">${dateFr}</time>`);
  t = sub(t, 'src="/emoji/sheaf-of-rice.svg" alt="" width="96" height="96" decoding="async"></span> Catégorie</div>', `src="/emoji/${emoji}.svg" alt="" width="96" height="96" decoding="async"></span> ${esc(o.category)}</div>`);
  t = sub(t, `src="/${o.image}" alt="${esc(o.alt)}" loading="eager" width="1080" height="810">`, `src="/${o.image}" alt="${esc(o.alt)}" loading="eager" width="${w}" height="${h}">`);
  t = sub(t, '<figcaption class="article-caption">Légende de la photo</figcaption>', `<figcaption class="article-caption">${esc(caption)}</figcaption>`);
  // ?v= du CSS/JS : identique à celui du reste du site (garde-fou check-page-scaffold)
  const home = read('index.html');
  for (const asset of ['style.css', 'script.js']) {
    const v = new RegExp(`/${asset.replace('.', '\\.')}\\?v=([^"']+)`).exec(home);
    if (v) t = t.replace(new RegExp(`/${asset.replace('.', '\\.')}\\?v=[^"']+`, 'g'), () => `/${asset}?v=${v[1]}`);
  }
  // nav, footer et overlay d'intro : copiés de l'article le plus récent (le gabarit peut prendre du retard sur le site)
  const refArticle = articlesOnDisk().filter((a) => a.slug !== slug).sort(byRecency)[0];
  if (refArticle) {
    const refHtml = read(refArticle.file);
    const blockRes = [
      /<nav id="mainNav"[\s\S]*?<\/nav>/,
      /<footer[\s\S]*?<\/footer>/,
      /<div id="lottie-overlay"[\s\S]*?<span class="lottie-sub">[^<]*<\/span>\s*<\/div>\s*<\/div>/,
    ];
    for (const re of blockRes) {
      const fromRef = re.exec(refHtml);
      if (!fromRef || !re.test(t)) die('bloc nav/footer/overlay introuvable (page de référence ou gabarit)');
      t = t.replace(re, () => fromRef[0].split(`/blog/${refArticle.slug}"`).join(`/blog/${slug}"`));
    }
  }
  if (o.body) {
    if (!fs.existsSync(o.body)) die(`--body : fichier introuvable (${o.body})`);
    const body = fs.readFileSync(o.body, 'utf8').trim();
    const re = /(<div class="article-body">\n)[\s\S]*?(\n<\/div>\n\n<a href="\/blog" class="article-back">)/;
    if (!re.test(t)) die('gabarit : bloc .article-body introuvable');
    t = t.replace(re, (_, a, z) => `${a}${body}${z}`);
  }
  // commentaires d'instruction : tous retirés, sauf celui du corps tant qu'il reste à écrire
  t = t.replace(/<!--\s*À REMPLACER[\s\S]*?-->\n?/g, (c) => (!o.body && c.includes("corps de l'article") ? c : ''));
  put(`blog/${slug}.html`, t);

  // ---- 2. maillage ---------------------------------------------------------
  const fresh = { slug, file: `blog/${slug}.html`, date: o.date, headline: o.title, category: o.category };
  const all = [...articlesOnDisk().filter((a) => a.slug !== slug), fresh].sort(byRecency);
  const sidebarRe = /<a href="\/blog\/([^"]+)" class="sidebar-post">[\s\S]*?<\/a>\n/g;
  const sideBlock = (a, img, alt, iw, ih, title) => `      <a href="/blog/${a}" class="sidebar-post">
        <div class="sidebar-post-img"><img src="/${img}" alt="${esc(alt)}" loading="lazy" width="${iw}" height="${ih}"></div>
        <div>
          <h4>${esc(title)}</h4>
          <span class="sidebar-date">${dateFr}</span>
        </div>
      </a>
`;
  // barres latérales : blocs existants réutilisés tels quels, bloc du nouvel article généré
  const blocks = { [slug]: sideBlock(slug, o.image, o.alt, w, h, o.title) };
  for (const a of all) if (a.slug !== slug) for (const m of get(a.file).matchAll(sidebarRe)) if (!blocks[m[1]]) blocks[m[1]] = m[0].replace(/^\s*/, '      ');
  for (const a of all) {
    const want = all.filter((x) => x.slug !== a.slug).slice(0, 3).map((x) => blocks[x.slug]);
    if (want.some((b) => !b)) die(`barre latérale : bloc manquant (aucun article ne contient encore un lien vers un des 3 plus récents)`);
    const page = get(a.file);
    const found = [...page.matchAll(sidebarRe)];
    if (!found.length) die(`${a.file} : pas de .sidebar-post`);
    const start = found[0].index;
    const last = found[found.length - 1];
    put(a.file, page.slice(0, start) + want.join('') + page.slice(last.index + last[0].length));
  }

  // accueil : 4 cartes les plus récentes (cartes existantes réutilisées)
  const cardRe = /      <a href="\/blog\/([^"]+)" class="album-blog-card">[\s\S]*?<\/a>\n/g;
  const listRe = /(<div class="album-blog-list">\n)((?:      <a href="\/blog\/[^"]+" class="album-blog-card">[\s\S]*?<\/a>\n)+)(    <\/div>)/;
  const homeHtml = get('index.html');
  const listMatch = listRe.exec(homeHtml);
  if (!listMatch) die('index.html : .album-blog-list introuvable');
  const cards = {};
  for (const m of listMatch[2].matchAll(cardRe)) cards[m[1]] = m[0];
  const homeCard = (a, img, alt, iw, ih, tagImg, tag, title) => `      <a href="/blog/${a}" class="album-blog-card">
        <div class="album-blog-img"><img src="/${img}" alt="${esc(alt)}" loading="lazy" width="${iw}" height="${ih}"></div>
        <div class="album-blog-body">
          <span class="album-blog-tag"><span aria-hidden="true"><img class="emo" src="/emoji/${tagImg}.svg" alt="" width="96" height="96" decoding="async"></span> ${tag}</span>
          <h3>${esc(title)}</h3>
        </div>
        <span class="album-blog-lien" aria-hidden="true">→</span>
      </a>
`;
  cards[slug] = homeCard(slug, o.image, o.alt, w, h, 'newspaper', 'Nouvel article', o.shortTitle || o.title);
  const top4 = all.slice(0, 4);
  const list = top4.map((a) => {
    let c = cards[a.slug];
    if (!c) { // article plus ancien absent de l'accueil : carte générée depuis ses métadonnées
      const side = blocks[a.slug].match(/<img src="\/([^"]+)" alt="([^"]*)" loading="lazy" width="(\d+)" height="(\d+)">/);
      return homeCard(a.slug, side[1], side[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&'), side[3], side[4], 'newspaper', esc(a.category), a.headline);
    }
    // l'ancienne « Nouvel article » reprend sa catégorie
    if (a.slug !== slug && c.includes('</span> Nouvel article</span>')) c = c.replace('</span> Nouvel article</span>', () => `</span> ${esc(a.category)}</span>`);
    return c;
  }).join('');
  put('index.html', homeHtml.replace(listRe, (_, open, __, close) => `${open}${list}${close}`));

  // blog/index.html : la une devient une carte normale, le nouvel article prend la une
  let idx = get('blog/index.html');
  const featRe = /    <a href="\/blog\/([^"]+)" class="blog-card blog-card-featured">[\s\S]*?<\/a>\n/;
  const feat = featRe.exec(idx);
  if (!feat) die('blog/index.html : .blog-card-featured introuvable');
  const demoted = feat[0].replace('class="blog-card blog-card-featured"', 'class="blog-card"').replace('À la une — ', '')
    .split('\n').map((l) => (l ? `  ${l}` : l)).join('\n');
  const summary = o.summary || o.description;
  const featured = `    <a href="/blog/${slug}" class="blog-card blog-card-featured">
      <div class="blog-card-img">
        <img src="/${o.image}" alt="${esc(o.alt)}" loading="lazy" width="${w}" height="${h}">
      </div>
      <div class="blog-card-body">
        <span class="blog-meta">À la une — ${esc(o.category)}</span>
        <h2>${esc(o.title)}</h2>
        <p>${esc(summary)}</p>
        <span class="blog-card-lien">Lire l'article →</span>
      </div>
    </a>
`;
  idx = idx.replace(featRe, () => featured);
  idx = sub(idx, '<div class="blog-grid">\n', `<div class="blog-grid">\n${demoted}`);
  idx = sub(idx, '"hasPart": [\n', `"hasPart": [
    {
      "@type": "BlogPosting",
      "headline": "${json(o.title)}",
      "url": "${url}"
    },
`);
  put('blog/index.html', idx);

  // ---- 3. sitemap.xml ------------------------------------------------------
  let sm = get('sitemap.xml');
  const firstArticle = sm.indexOf('  <url>\n    <loc>https://anarekaci.com/blog/');
  if (firstArticle < 0) die('sitemap.xml : aucune entrée d\'article pour se repérer');
  const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const entry = `  <url>
    <loc>${url}</loc>
    <lastmod>${o.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <image:image>
      <image:loc>https://anarekaci.com/${o.image}</image:loc>
      <image:title>${xml(o.alt)}</image:title>
    </image:image>
  </url>
`;
  sm = sm.slice(0, firstArticle) + entry + sm.slice(firstArticle);
  put('sitemap.xml', sm);

  // ---- écriture ------------------------------------------------------------
  for (const [f, content] of writes) {
    if (dryRun) console.log(`[dry-run] ${f}`);
    else fs.writeFileSync(rel(f), content);
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}Article « ${slug} » : ${writes.size} fichier(s) ${dryRun ? 'concernés' : 'écrits'}.`);
  console.log('Reste à faire : écrire le corps' + (o.body ? ' (fourni)' : ' dans blog/' + slug + '.html') + ', puis npm run check et relire la page.');
  if (!o.body) console.log("Attention : le corps du gabarit est encore en place (marqueur « À REMPLACER »).");
}

main();
