#!/usr/bin/env node
'use strict';

/*
 * Hygiène du dépôt :
 *  - aucune fin de ligne CRLF dans les fichiers texte servis (un CRLF change
 *    silencieusement les hash CSP des scripts inline — voir .gitattributes)
 *  - .well-known/security.txt présent, avec Contact et un Expires encore valide
 *    (plus de 30 jours devant) ; un security.txt expiré n'est plus valide (RFC 9116)
 */

const fs = require('fs');
const path = require('path');
const { ROOT, report } = require('./lib/pages');

const problems = [];
const TEXT = /\.(html|css|js|xml|txt|json|webmanifest|md|yml|yaml|svg)$|^(_headers|_redirects)$/;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (TEXT.test(e.name) && fs.readFileSync(full, 'utf8').includes('\r\n')) {
      problems.push(`${path.relative(ROOT, full).replace(/\\/g, '/')} : fins de ligne CRLF (attendu : LF — vérifier core.autocrlf)`);
    }
  }
}
walk(ROOT);

const sec = path.join(ROOT, '.well-known', 'security.txt');
if (!fs.existsSync(sec)) {
  problems.push('.well-known/security.txt manquant');
} else {
  const txt = fs.readFileSync(sec, 'utf8');
  if (!/^Contact:\s*\S+/m.test(txt)) problems.push('security.txt : champ Contact manquant');
  const m = txt.match(/^Expires:\s*(\S+)/m);
  if (!m) problems.push('security.txt : champ Expires manquant');
  else {
    const left = (new Date(m[1]) - Date.now()) / 86400000;
    if (isNaN(left)) problems.push(`security.txt : Expires illisible (${m[1]})`);
    else if (left < 30) problems.push(`security.txt : expire dans ${Math.floor(left)} jour(s) — renouveler Expires`);
  }
}

report('check-hygiene', problems, 'Hygiène du dépôt OK (LF partout, security.txt valide).');
