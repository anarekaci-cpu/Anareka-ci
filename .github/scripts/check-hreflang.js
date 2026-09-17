#!/usr/bin/env node
'use strict';

/*
 * Vérifie programmatiquement la réciprocité hreflang (Lot 6, Phase 6.3) :
 *
 * 1. Sur chaque page HTML qui déclare des balises
 *    <link rel="alternate" hreflang="...">, la page pointée par le hreflang
 *    "fr" doit elle-même déclarer un hreflang "en" pointant en retour vers
 *    la page de départ (et inversement) — la norme Google exige cette
 *    réciprocité, une annotation non réciproque est ignorée par les moteurs.
 * 2. Chaque page qui déclare des hreflang doit avoir exactement un
 *    hreflang="fr", un hreflang="en" et un hreflang="x-default", et ce
 *    x-default doit pointer vers la version FR (langue principale du site).
 * 3. Même vérification sur sitemap.xml : chaque <url> qui déclare des
 *    <xhtml:link rel="alternate" hreflang="..."> doit être réciproque avec
 *    l'URL qu'elle cible.
 *
 * Les articles de blog (FR-only, sans équivalent EN) ne déclarent
 * volontairement aucun hreflang : ils sont ignorés par ce contrôle, pas
 * en échec.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

function findHtmlFiles(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === 'templates') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('google')) {
      out.push(full);
    }
  }
  return out;
}

let ok = true;
const problems = [];

function toUrl(loc) {
  return loc.replace(/\/$/, '') || '/';
}

// --- 1 & 2 : pages HTML ---------------------------------------------------

const files = findHtmlFiles('.').sort();
const pageHreflangs = new Map(); // canonicalUrl -> { file, hreflangs: {fr, en, 'x-default'} }

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const root = parse(html);
  const canonicalEl = root.querySelector('link[rel="canonical"]');
  const alternates = root.querySelectorAll('link[rel="alternate"][hreflang]');
  if (alternates.length === 0) continue; // page sans hreflang (ex. adhesion.html, article de blog) : ignorée

  if (!canonicalEl) {
    ok = false;
    problems.push(`\n✗ ${file} — déclare des hreflang mais n'a pas de <link rel="canonical">`);
    continue;
  }
  const canonical = toUrl(canonicalEl.getAttribute('href'));
  const hreflangs = {};
  for (const a of alternates) {
    hreflangs[a.getAttribute('hreflang')] = toUrl(a.getAttribute('href'));
  }
  pageHreflangs.set(canonical, { file, hreflangs });

  for (const required of ['fr', 'en', 'x-default']) {
    if (!hreflangs[required]) {
      ok = false;
      problems.push(`\n✗ ${file} — hreflang="${required}" manquant`);
    }
  }
  if (hreflangs.fr && hreflangs['x-default'] && hreflangs.fr !== hreflangs['x-default']) {
    ok = false;
    problems.push(
      `\n✗ ${file} — x-default ("${hreflangs['x-default']}") devrait pointer vers la version FR ("${hreflangs.fr}")`
    );
  }
}

for (const [canonical, { file, hreflangs }] of pageHreflangs) {
  for (const lang of ['fr', 'en']) {
    const target = hreflangs[lang];
    if (!target) continue;
    if (target === canonical) continue; // la page pointe vers elle-même (cas normal pour sa propre langue)
    const targetRecord = pageHreflangs.get(target);
    if (!targetRecord) {
      ok = false;
      problems.push(`\n✗ ${file} — hreflang="${lang}" pointe vers "${target}", page introuvable ou sans hreflang`);
      continue;
    }
    const otherLang = lang === 'fr' ? 'en' : 'fr';
    if (targetRecord.hreflangs[otherLang] !== canonical) {
      ok = false;
      problems.push(
        `\n✗ Réciprocité rompue : ${file} (hreflang="${lang}" → "${target}") mais ${targetRecord.file} ` +
        `ne pointe pas en retour vers "${canonical}" (hreflang="${otherLang}" = "${targetRecord.hreflangs[otherLang] || 'absent'}")`
      );
    }
  }
}

// --- 3 : sitemap.xml -------------------------------------------------------

if (fs.existsSync('sitemap.xml')) {
  const xml = fs.readFileSync('sitemap.xml', 'utf8');
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const sitemapEntries = new Map(); // loc -> { fr, en, 'x-default' }

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) continue;
    const loc = toUrl(locMatch[1]);
    const links = [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)];
    if (links.length === 0) continue;
    const hreflangs = {};
    for (const [, hreflang, href] of links) hreflangs[hreflang] = toUrl(href);
    sitemapEntries.set(loc, hreflangs);
  }

  for (const [loc, hreflangs] of sitemapEntries) {
    for (const lang of ['fr', 'en']) {
      const target = hreflangs[lang];
      if (!target || target === loc) continue;
      const targetHreflangs = sitemapEntries.get(target);
      if (!targetHreflangs) {
        ok = false;
        problems.push(`\n✗ sitemap.xml — <loc>${loc}</loc> hreflang="${lang}" pointe vers "${target}", absent du sitemap ou sans hreflang`);
        continue;
      }
      const otherLang = lang === 'fr' ? 'en' : 'fr';
      if (targetHreflangs[otherLang] !== loc) {
        ok = false;
        problems.push(
          `\n✗ sitemap.xml — réciprocité rompue : <loc>${loc}</loc> (hreflang="${lang}" → "${target}") mais "${target}" ` +
          `ne pointe pas en retour vers "${loc}"`
        );
      }
    }
  }
} else {
  problems.push('\n(sitemap.xml introuvable — vérification ignorée)');
}

if (!ok) {
  console.error('Incohérences hreflang détectées :');
  problems.forEach((p) => console.error(p));
  process.exit(1);
}

console.log(`Réciprocité hreflang cohérente sur ${pageHreflangs.size} page(s) HTML et sur sitemap.xml.`);
