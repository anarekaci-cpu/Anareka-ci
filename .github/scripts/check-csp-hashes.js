#!/usr/bin/env node
'use strict';

/*
 * Garde-fou CSP : la Content-Security-Policy de `_headers` n'autorise plus
 * 'unsafe-inline' pour les scripts. Chaque <script> inline exécutable d'une
 * page doit donc avoir son empreinte SHA-256 listée dans script-src, sinon
 * le navigateur le bloque silencieusement en production.
 *
 * Ce contrôle échoue si :
 *   1. un script inline n'a pas son 'sha256-…' dans script-src ;
 *   2. un hash de script-src ne correspond plus à aucun script (hash
 *      obsolète après modification d'un script inline) ;
 *   3. un attribut de gestionnaire d'événement inline (onclick=…) existe
 *      (bloqué par la CSP sans 'unsafe-hashes').
 *
 * Les blocs JSON-LD (type="application/ld+json") ne s'exécutent pas et ne
 * sont pas concernés.
 *
 * Si ce contrôle échoue après une modification volontaire d'un script
 * inline : recopier le hash affiché dans script-src de `_headers`.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');

function findHtmlFiles(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === 'templates') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('google')) out.push(full);
  }
  return out;
}

const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
const cspLine = headers.split('\n').find(l => /^\s*Content-Security-Policy:/i.test(l));
if (!cspLine) { console.error('Aucune Content-Security-Policy trouvée dans _headers.'); process.exit(1); }
const scriptSrc = (cspLine.match(/script-src([^;]*)/) || [, ''])[1];
const allowed = new Set([...scriptSrc.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map(m => m[1]));
const unsafeInline = /'unsafe-inline'/.test(scriptSrc);

const errors = [];
const used = new Set();
const EXEC_TYPES = ['', 'text/javascript', 'module', 'application/javascript'];

for (const file of findHtmlFiles(ROOT)) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    const type = ((attrs.match(/\btype\s*=\s*["']([^"']*)["']/i) || [, ''])[1]).toLowerCase();
    if (!EXEC_TYPES.includes(type)) continue;
    const hash = crypto.createHash('sha256').update(m[2], 'utf8').digest('base64');
    used.add(hash);
    if (!unsafeInline && !allowed.has(hash)) {
      errors.push(`${rel} : script inline non autorisé par la CSP — ajouter 'sha256-${hash}' à script-src dans _headers`);
    }
  }
  const handler = html.match(/<[a-z][^>]*\son[a-z]+\s*=\s*["']/i);
  if (handler) errors.push(`${rel} : gestionnaire d'événement inline (${handler[0].slice(0, 60)}…) bloqué par la CSP — le déplacer dans script.js`);
}

for (const h of allowed) {
  if (!used.has(h)) errors.push(`_headers : 'sha256-${h}' ne correspond plus à aucun script inline — hash obsolète à retirer`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`CSP cohérente : ${used.size} script(s) inline distinct(s), tous autorisés par hash.`);
