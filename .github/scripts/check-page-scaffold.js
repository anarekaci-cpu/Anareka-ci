#!/usr/bin/env node
'use strict';

/*
 * Vérifie la cohérence du gabarit sur un site bilingue (FR + EN, voir Lot 6) :
 *
 * 1. Cohérence interne PAR LANGUE : le bloc <nav id="mainNav"> et le <footer>
 *    doivent être identiques entre toutes les pages FR entre elles, et entre
 *    toutes les pages EN entre elles (deux groupes, deux références — pas une
 *    seule référence globale, puisque les libellés et les URLs diffèrent
 *    légitimement d'une langue à l'autre).
 *
 * 2. Équivalence STRUCTURELLE entre les deux langues : la cohérence interne
 *    de chaque groupe ne suffit pas — la nav EN pourrait être cohérente avec
 *    elle-même tout en ayant un lien en moins que la nav FR, sans que rien ne
 *    le détecte. On vérifie donc, sur une paire de pages de référence
 *    (l'accueil FR et l'accueil EN) : même nombre de liens dans .nav-links,
 *    .footer-nav et le logo, et même destination position par position (le
 *    href EN attendu = "/en" + le href FR, fragment #ancre compris). On ne
 *    juge pas la traduction des libellés, seulement la structure.
 *    Si aucune page EN n'existe encore, cette vérification est ignorée
 *    (rien à comparer) plutôt que de faire échouer la CI.
 *
 * 3. Champs indépendants de la langue, vérifiés globalement sur toutes les
 *    pages sans distinction FR/EN : le paramètre ?v= de style.css, celui de
 *    script.js, et l'année de copyright (.footer-year) — même CSS, même JS,
 *    même année pour tout le monde.
 *
 * Normalisations légitimes avant comparaison des blocs nav/footer :
 * - aria-current="page" retiré (un seul lien le porte, jamais le même
 *   selon la page)
 * - contenu de .footer-year remplacé par un jeton neutre (valeur
 *   dynamique, vérifiée séparément pour égalité exacte)
 * - href des liens .lang-switch remplacés par un jeton neutre (chaque page
 *   pointe légitimement vers sa propre traduction, jamais la même selon
 *   la page — voir la vérification d'équivalence structurelle au point 2
 *   pour ce qui est réellement contrôlé sur ce lien)
 *
 * Aucune normalisation de chemin relatif : les pages doivent utiliser
 * des chemins racine-absolus (/association, /style.css, ...), qui
 * s'écrivent alors à l'identique quelle que soit la profondeur du
 * dossier.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

function findHtmlFiles(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules') continue;
    if (entry.name === 'templates') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('google')) {
      out.push(full);
    }
  }
  return out;
}

function normalizeBlock(el) {
  if (!el) return null;
  const clone = el.clone();
  clone.querySelectorAll('a').forEach((a) => a.removeAttribute('aria-current'));
  const yearSpan = clone.querySelector('.footer-year');
  if (yearSpan) yearSpan.set_content('{YEAR}');
  // .lang-switch pointe légitimement vers une page différente sur chaque
  // page (le lien EN de la page /missions pointe vers /en/missions, celui
  // de /association vers /en/association, etc.) — neutraliser ses href
  // avant comparaison, comme .footer-year, plutôt que de le laisser casser
  // la vérification de cohérence interne par langue.
  clone.querySelectorAll('.lang-switch a').forEach((a) => a.setAttribute('href', '{LANG_LINK}'));
  return clone.toString().replace(/\s+/g, ' ').trim();
}

function extractQueryVersion(html, assetName) {
  const re = new RegExp(assetName.replace('.', '\\.') + '\\?v=([\\w.-]+)');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractYear(html) {
  const m = html.match(/class="footer-year">(\d{4})</);
  return m ? m[1] : null;
}

function langOf(file) {
  return file.replace(/\\/g, '/').replace(/^\.\//, '').startsWith('en/') ? 'en' : 'fr';
}

const files = findHtmlFiles('.').sort();
const records = files.map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const root = parse(html);
  return {
    file,
    lang: langOf(file),
    nav: normalizeBlock(root.querySelector('#mainNav')),
    footer: normalizeBlock(root.querySelector('footer')),
    cssV: extractQueryVersion(html, 'style.css'),
    jsV: extractQueryVersion(html, 'script.js'),
    year: extractYear(html),
  };
});

let ok = true;
const problems = [];

// Cohérence interne : une référence par langue, pas une référence globale.
function checkFieldPerLanguage(label, key) {
  for (const lang of ['fr', 'en']) {
    const withValue = records.filter((r) => r.lang === lang && r[key] !== null);
    if (withValue.length === 0) continue;
    const reference = withValue[0][key];
    const refFile = withValue[0].file;
    const diverging = withValue.filter((r) => r[key] !== reference);
    if (diverging.length) {
      ok = false;
      problems.push(`\n✗ ${label} [${lang}] — divergent de la référence (${refFile}) :`);
      diverging.forEach((r) => problems.push(`    ${r.file}`));
    }
  }
}

// Champs indépendants de la langue : une seule référence globale.
function checkFieldGlobal(label, key) {
  const withValue = records.filter((r) => r[key] !== null);
  if (withValue.length === 0) return;
  const reference = withValue[0][key];
  const refFile = withValue[0].file;
  const diverging = withValue.filter((r) => r[key] !== reference);
  if (diverging.length) {
    ok = false;
    problems.push(`\n✗ ${label} — divergent de la référence (${refFile}) :`);
    diverging.forEach((r) => problems.push(`    ${r.file}`));
  }
}

// Équivalence structurelle FR <-> EN : même nombre de liens et mêmes
// destinations (à la langue près) dans .nav-links, .footer-nav et le logo,
// en comparant une page de référence de chaque langue. Ignoré tant qu'aucune
// page EN n'existe.
// Exceptions volontaires à la règle mécanique "/en" + href FR : pages ou
// ancres qui n'ont delibérément pas d'équivalent traduit direct (Lot 6).
const FR_TO_EN_HREF_EXCEPTIONS = {
  // Ancre de la page d'accueil : le id de la section hero est traduit
  // accueil -> home dans en/index.html, donc le lien logo doit pointer
  // vers /en/#home et non /en/#accueil (dérivation mécanique erronée).
  '/#accueil': '/en/#home',
  // /adhesion (formulaire d'adhésion) reste volontairement FR-only : les
  // pages EN renvoient vers l'original FR plutôt que vers une page /en/adhesion
  // qui n'existe pas.
  '/adhesion': '/adhesion',
};

function mapFrHrefToEn(frHref) {
  if (Object.prototype.hasOwnProperty.call(FR_TO_EN_HREF_EXCEPTIONS, frHref)) {
    return FR_TO_EN_HREF_EXCEPTIONS[frHref];
  }
  if (frHref === '/') return '/en/';
  if (frHref.startsWith('/')) return '/en' + frHref;
  return null; // forme inattendue (lien externe, etc.) — non vérifiée ici
}

function checkNavStructuralEquivalence() {
  const frRef = records.find((r) => r.lang === 'fr' && /(^|\/)index\.html$/.test(r.file)) ||
                records.find((r) => r.lang === 'fr');
  const enRef = records.find((r) => r.lang === 'en');
  if (!frRef || !enRef) return; // rien à comparer pour l'instant

  const frRoot = parse(fs.readFileSync(frRef.file, 'utf8'));
  const enRoot = parse(fs.readFileSync(enRef.file, 'utf8'));

  const targets = [
    ['Lien logo (nav)', '.nav-logo'],
    ['Liens .nav-links', '.nav-links a'],
    ['Liens .footer-nav', '.footer-nav a'],
  ];

  for (const [label, selector] of targets) {
    const frHrefs = frRoot.querySelectorAll(selector).map((a) => a.getAttribute('href'));
    const enHrefs = enRoot.querySelectorAll(selector).map((a) => a.getAttribute('href'));
    if (frHrefs.length !== enHrefs.length) {
      ok = false;
      problems.push(
        `\n✗ ${label} — nombre de liens différent entre FR (${frRef.file}, ${frHrefs.length}) ` +
        `et EN (${enRef.file}, ${enHrefs.length})`
      );
      continue;
    }
    frHrefs.forEach((frHref, i) => {
      const expected = mapFrHrefToEn(frHref);
      const actual = enHrefs[i];
      if (expected !== null && actual !== expected) {
        ok = false;
        problems.push(
          `\n✗ ${label} [position ${i}] — attendu "${expected}" (dérivé de "${frHref}" dans ` +
          `${frRef.file}), trouvé "${actual}" dans ${enRef.file}`
        );
      }
    });
  }
}

checkFieldPerLanguage('Bloc <nav id="mainNav">', 'nav');
checkFieldPerLanguage('Bloc <footer>', 'footer');
checkNavStructuralEquivalence();
checkFieldGlobal('Paramètre ?v= de style.css', 'cssV');
checkFieldGlobal('Paramètre ?v= de script.js', 'jsV');
checkFieldGlobal('Année de copyright (.footer-year)', 'year');

if (!ok) {
  console.error('Incohérences de gabarit détectées :');
  problems.forEach((p) => console.error(p));
  process.exit(1);
}

console.log(`Gabarit cohérent sur ${files.length} page(s).`);
