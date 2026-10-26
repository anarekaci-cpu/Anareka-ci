# SEO audit (methodology: claude-seo, AgriciDaniel)

Scope: 23 HTML pages, sitemap.xml, robots.txt, _headers, site.webmanifest, JSON-LD.
Checklist borrowed from claude-seo's seo-page, seo-hreflang, seo-schema and seo-geo guidance (read only; none of its scripts were run).

## Verdict
The site was already in good shape. There are no critical issues, and the changes below are small.

## Findings

| Sev. | Area | Finding | Status |
|---|---|---|---|
| Low | Blog sitemap | Two `<lastmod>` values disagreed with the article's JSON-LD `dateModified` (dibou-productrices-attieke 08-27 vs 08-31; oipi-anareka-ci-partenariat-strategique 08-17 vs 08-10). | Fixed |
| Low | Blog meta | Articles had no `article:published_time`, `article:modified_time` or `article:section` Open Graph tags. | Fixed (6 articles) |
| Low | Blog JSON-LD | `BlogPosting` had no `description`, and `author`/`publisher` were not linked to the site's Organization entity. | Fixed: `description` added; `@id` `https://anarekaci.com/#organization` added on author/publisher |
| Info | HowTo schema | `/attieke` and `/en/attieke` still carry `HowTo` markup. Google retired HowTo rich results, and claude-seo says to stop recommending it. It does no harm. | Left; the owner may remove it |
| Info | FAQPage | Present on `/association`, `/attieke` and `/adhesion` (FR and EN). FAQ rich results were retired in 2026 per claude-seo. The pages hold a real FAQ, so the markup was kept. | Left |
| Info | llms.txt | Not added. claude-seo's `seo-geo` reference reports that Google rejects llms.txt as ineffective and gives it no weight. | Not done, by choice |
| Info | Homepage meta description | The FR description is 157 characters, at the upper edge of the 150-160 range. | Left |

## Already good (no change)
- Every page has a unique title (35-65 characters) and meta description (120-157 characters), in FR and EN.
- Each page has exactly one `h1`, and every page has a self-referencing canonical.
- FR/EN hreflang is reciprocal and includes `x-default`, in both the HTML and the sitemap. This is guarded by CI.
- Open Graph and Twitter cards are complete, with image alt text, width and height, and `og:locale`.
- JSON-LD:
  - Organization with address, geo, hours, contact points, sameAs and the PropertyValue identifier (récépissé).
  - WebSite and BreadcrumbList.
  - WebPage, ContactPage and CollectionPage.
  - Article and BlogPosting; FAQPage and VideoObject where real content exists.
  - No invented facts.
- Every `<img>` has an `alt`. The empty alts are all decorative (emoji, logo in the nav, lightbox placeholder). Images have width/height, with eager loading on the LCP image only.
- Security headers and CSP are present, templates/tests/.github are `noindex` through `X-Robots-Tag`, and 404 is `noindex`.
- robots.txt allows crawling and links the sitemap. The sitemap includes image entries and hreflang alternates.
- Fonts are self-hosted and preloaded, and the stylesheet is cache-busted.

## Remaining (needs owner decision)
1. Homepage word count and entity content: consider adding a short, factual "Qui sommes-nous" paragraph with dates and figures that only the owner can confirm. Nothing was invented.
2. Blog articles are FR-only by design (see CLAUDE.md). An EN translation would capture English queries, but the no-build-step decision would need revisiting.
3. External signals (Google Business Profile, Wikidata, YouTube and LinkedIn presence) drive AI-search visibility, according to claude-seo. They cannot be done in the repo. `sameAs` currently lists only Facebook and LinkedIn.
4. Real Core Web Vitals need a Lighthouse or CrUX run on the deployed site; they cannot be measured from HTML alone. style.css and script.js were deliberately not touched.
5. Optional: remove HowTo markup from the attieke pages.
