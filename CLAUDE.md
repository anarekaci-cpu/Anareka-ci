# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture decision: no build step, by design

This is a static HTML/CSS/JS site (Cloudflare Pages serves the repo files as-is — no
bundler, no SSG, no templating engine). Pages are hand-duplicated from a common
scaffold (nav/footer/head) rather than generated from a shared component. This is
intentional, not a shortcut: a CI guard script (`check-page-scaffold`, see below)
enforces the scaffold stays identical across pages in place of a real component system.

This decision holds only as long as both are true (documented in `.github/workflows/ci.yml`):
1. Total HTML page count stays under ~30.
2. The site stays bilingual (FR + EN, no third language).

If a third language is added, or blog articles need translation (they are currently
FR-only by design — see below), revisit build tooling (SSG/templating) instead of
piling on more manual duplication.

## Site structure

- **Bilingual mirror**: FR lives at the repo root, EN under `/en/` as a parallel
  directory tree (`en/association/`, `en/attieke/`, `en/blog/`, etc.). Blog articles
  are FR-only — they intentionally have no EN equivalent and no hreflang tags.
- **Clean URLs**: every page is `{slug}/index.html`, not `{slug}.html`. Internal
  links must always use the extensionless clean URL (`/blog/{slug}`, never
  `/blog/{slug}.html`) — this applies to `<a href>` and to URLs embedded in JSON-LD.
- **Paths are root-absolute**, never relative (`/style.css`, `/association`, not
  `../style.css`) — required for the scaffold to be byte-identical regardless of a
  page's folder depth.
- `templates/article-template.html` + `templates/GUIDE-PUBLICATION-ARTICLE.md`:
  the exact, step-by-step procedure for publishing a new blog article. Read the
  guide in full before adding a blog post — it covers the three places a new
  article must be linked from (see below), sitemap entry format, and the
  pre-commit checklist. Don't improvise a different process.

## Publishing a blog article — key constraints from the guide

A new article is **not** auto-discovered anywhere; every location below is a
manual edit:
1. Copy `templates/article-template.html` → `blog/{slug}.html`. Fill every
   `<!-- À REMPLACER -->` marker. `canonical`, `og:url`, and `mainEntityOfPage`
   must all match `https://anarekaci.com/blog/{slug}`. First image keeps
   `loading="eager"` (it's the LCP); every other image is `loading="lazy"`, and
   `width`/`height` must be the image's real pixel dimensions (avoids CLS).
2. Update internal linking in three places, each maintained by hand:
   - `blog.html` — the new article becomes `.blog-card-featured`; the previous
     featured card drops into `.blog-grid`.
   - `index.html`'s `.album-blog-list` — keeps exactly 4 cards, newest first.
   - The `<aside class="article-sidebar">` of the 3 most recent *other*
     articles — add the new link, drop their oldest if already at 3.
3. Add a `sitemap.xml` entry right after `<url>https://anarekaci.com/blog</url>`,
   using `changefreq=monthly`/`priority=0.7` (permanent pages range 0.3–1.0 instead).
4. Category must reuse an existing value exactly — do not invent a new one.
   Known categories: `Visite d'échange`, `Patrimoine & Savoir-faire`,
   `Nomination officielle`, `Hygiène & Salubrité`, `Partenariat`. (The former
   variant `Visite d'échanges` was unified to `Visite d'échange` in Sept. 2026 —
   don't reintroduce it.)
5. If — and only if — the edit also touched `style.css` or `script.js`, bump the
   `?v=...` cache-busting query param on **every single page** that references
   the changed file. `check-page-scaffold` fails the build on purpose if the
   version param isn't identical across all pages.

## Local setup

```
npm install        # installs node-html-parser (only dev dependency)
npm run check      # scaffold + hreflang + CSP hash guards (same as CI)
npm run dev        # wrangler pages dev on http://localhost:8788 — applies _headers/_redirects like production
```

## CI guard scripts (run locally with Node + `node-html-parser`)

```
node .github/scripts/check-page-scaffold.js
node .github/scripts/check-hreflang.js
node .github/scripts/check-csp-hashes.js
```

- **`check-csp-hashes.js`**: `script-src` in `_headers` does **not** allow
  `'unsafe-inline'`; every executable inline `<script>` must have its
  `'sha256-…'` listed there. Fails on a missing hash, an obsolete hash, or any
  inline `on*=` event handler. If you edit an inline script (e.g. the
  `document.documentElement.classList.add('js')…` line in every `<head>` (it also sets `.seal-seen` for the page transition), or the
  legacy-anchor redirect script in `index.html`), copy the hash it prints into
  `_headers`.

- **`check-page-scaffold.js`**: three checks in one. (1) `<nav id="mainNav">` and
  `<footer>` must be byte-identical across all FR pages, and separately across all
  EN pages. (2) Structural parity between the FR and EN homepages specifically —
  same link count in `.nav-links`/`.footer-nav`/logo, same destinations
  position-by-position (EN href expected = `/en` + FR href) — catches an EN nav
  silently losing a link even though it's internally self-consistent. (3)
  Language-independent globals checked across *all* pages: the `?v=` param on
  `style.css`, the `?v=` param on `script.js`, and the copyright year in
  `.footer-year` must each be identical everywhere.
- **`check-hreflang.js`**: verifies hreflang reciprocity — if page A declares
  `hreflang="en"` pointing at page B, B must declare `hreflang="fr"` pointing back
  at A. Every page with hreflang tags must have exactly one `fr`, one `en`, and one
  `x-default` (pointing to the FR version, the primary language). Checked both
  across HTML pages and in `sitemap.xml`. FR-only blog articles are skipped, not
  failed.

## Other CI jobs (`.github/workflows/ci.yml`)

- **HTML validation**: downloads Nu Html Checker (`vnu.jar`) and validates every
  `*.html` except `templates/*` and `google*.html`. One deliberate filter is in
  place for `@view-transition` (CSS View Transitions Level 2), which vnu.jar
  doesn't yet recognize but Chrome supports natively — don't remove that filter
  thinking it's masking a real error.
- **Local link/image check**: `lychee` in offline mode against the whole repo
  (excludes `.git`, `templates`).
- **Minification dry-run**: reports HTML/CSS/JS minification savings to the job
  summary; does not modify the repo or affect deployment.

## Security headers (`_headers`)

Cloudflare Pages headers file sets HSTS, `X-Content-Type-Options`,
`X-Frame-Options`, a `Content-Security-Policy` allowlisting only the external
origins actually used (Cloudflare Web Analytics, Formspree, YouTube nocookie
embeds; fonts are self-hosted) and inline scripts by hash, and long-lived immutable caching for fonts/images vs. short
`must-revalidate` caching for CSS/JS/HTML. If you add a new external
script/style/font/frame source, update the matching CSP directive here or it will
be silently blocked in production.

`_redirects` is intentionally minimal (just `/` and `/en` root redirects) —
Cloudflare Pages' default folder resolution handles every other extensionless
route, so don't add per-page redirect rules for pages that already exist as
`{slug}/index.html`.

Cloudflare's zone-level "Add security headers" managed transform (dashboard →
Rules → Transform Rules → Managed Transforms) overrides `Referrer-Policy` with
`same-origin` and adds `X-XSS-Protection`/`Expect-CT` — that is why the served
`Referrer-Policy` differs from `_headers`. Change it there, not in this repo.

Everything in the repo is publicly served, including `CLAUDE.md`, `.github/`,
`package.json` and `templates/`. Never commit secrets or private notes.
