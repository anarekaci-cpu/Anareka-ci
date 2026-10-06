'use strict';

/*
 * Mini serveur statique pour les tests e2e : imite Cloudflare Pages pour ce qui
 * compte ici — URLs propres (/x -> /x/index.html ou /x.html) et application des
 * règles de _headers (dont la CSP). Évite la dépendance à workerd/wrangler en CI.
 * Usage : node tests/serve.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8788);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

// _headers : un bloc = une ligne de motif (commence par "/"), puis des lignes "  En-tête: valeur"
function loadRules() {
  const rules = [];
  let cur = null;
  for (const raw of fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      const re = new RegExp('^' + raw.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      cur = { re, headers: [] };
      rules.push(cur);
    } else if (cur) {
      const i = raw.indexOf(':');
      cur.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
    }
  }
  return rules;
}
const RULES = loadRules();

function resolveFile(urlPath) {
  const p = path.join(ROOT, decodeURIComponent(urlPath));
  if (!p.startsWith(ROOT)) return null;
  const candidates = [p, p + '.html', path.join(p, 'index.html')];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const file = resolveFile(urlPath);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('Not found');
  }
  // Cloudflare redirige /x vers /x/ quand x est un dossier ; on sert directement.
  const headers = { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' };
  const lookup = urlPath.endsWith('/') ? urlPath : urlPath;
  for (const r of RULES) {
    if (r.re.test(lookup)) r.headers.forEach(([k, v]) => { if (!(k.toLowerCase() === 'content-type' && false)) headers[k] = v; });
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`serve.js : http://localhost:${PORT}`));
