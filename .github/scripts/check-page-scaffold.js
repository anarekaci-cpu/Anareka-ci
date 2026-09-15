#!/usr/bin/env node
'use strict';

/*
 * Vérifie que le bloc <nav id="mainNav">, le <footer>, le paramètre ?v=
 * de style.css/script.js et l'année de copyright sont identiques sur
 * toutes les pages HTML du dépôt.
 *
 * Normalisations légitimes avant comparaison :
 * - aria-current="page" retiré (un seul lien le porte, jamais le même
 *   selon la page)
 * - contenu de .footer-year remplacé par un jeton neutre (valeur
 *   dynamique, vérifiée séparément pour égalité exacte)
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

const files = findHtmlFiles('.').sort();
const records = files.map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const root = parse(html);
  return {
    file,
    nav: normalizeBlock(root.querySelector('#mainNav')),
    footer: normalizeBlock(root.querySelector('footer')),
    cssV: extractQueryVersion(html, 'style.css'),
    jsV: extractQueryVersion(html, 'script.js'),
    year: extractYear(html),
  };
});

let ok = true;
const problems = [];

function checkField(label, key) {
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

checkField('Bloc <nav id="mainNav">', 'nav');
checkField('Bloc <footer>', 'footer');
checkField('Paramètre ?v= de style.css', 'cssV');
checkField('Paramètre ?v= de script.js', 'jsV');
checkField('Année de copyright (.footer-year)', 'year');

if (!ok) {
  console.error('Incohérences de gabarit détectées :');
  problems.forEach((p) => console.error(p));
  process.exit(1);
}

console.log(`Gabarit cohérent sur ${files.length} page(s).`);
