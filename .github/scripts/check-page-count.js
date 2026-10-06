#!/usr/bin/env node
'use strict';

/*
 * Garde-fou de la décision « pas d'étape de build » (voir CLAUDE.md et ci.yml).
 * Cette décision tient tant que le site reste sous ~30 pages HTML. On avertit
 * à partir de 28 pages et on échoue au-delà de la limite, pour forcer une
 * décision explicite (SSG/templating) plutôt que de dériver.
 *
 * Pour relever la limite en connaissance de cause : changer NO_BUILD_LIMIT ici
 * ET mettre à jour CLAUDE.md.
 */

const { findHtmlFiles } = require('./lib/pages');

const NO_BUILD_LIMIT = 30;
const WARN_AT = 28;
const count = findHtmlFiles().length;

if (count > NO_BUILD_LIMIT) {
  console.error(`✗ ${count} pages HTML : limite de ${NO_BUILD_LIMIT} dépassée — rouvrir la question d'un build (SSG/templating) ou relever NO_BUILD_LIMIT explicitement.`);
  process.exit(1);
}
if (count >= WARN_AT) console.log(`::warning::${count} pages HTML sur ${NO_BUILD_LIMIT} autorisées sans build — prévoir la décision SSG.`);
console.log(`${count} pages HTML (limite sans build : ${NO_BUILD_LIMIT}).`);
