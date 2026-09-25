# Guide de publication d'un nouvel article

Ce guide documente la procédure exacte pour publier un article sur ANAREKA-CI
MAG. Le site n'a pas d'étape de build (Cloudflare Pages sert les fichiers du
dépôt tels quels) : chaque étape ci-dessous est donc une modification directe
de fichiers versionnés, dans l'ordre indiqué.

Rédiger le texte de l'article reste un travail humain — ce guide couvre tout
le reste : gabarit, maillage interne, sitemap, vérifications.

## Avant de commencer

Réunis :
- Les photos définitives (déjà recadrées/compressées en `.webp`), avec leurs
  dimensions réelles en pixels (nécessaires pour `width`/`height`).
- Un **slug** : minuscules, tirets, sans accents ni espaces
  (ex. `orbaff-productrices-attieke`). Il sert de nom de fichier
  (`blog/{slug}.html`) et de segment d'URL (`/blog/{slug}`) — ne le change
  plus une fois l'article publié et indexé.
- Une **catégorie**. Catégories déjà utilisées sur le site (reprends-en une
  à l'identique, n'invente pas une variante singulier/pluriel) :
  `Visite d'échange`, `Patrimoine & Savoir-faire`, `Nomination officielle`,
  `Hygiène & Salubrité`, `Partenariat`.
  La graphie `Visite d'échanges` (au pluriel) a été uniformisée en
  `Visite d'échange` en septembre 2026 : ne pas la réintroduire.

## 1. Créer le fichier de l'article

1. Copie `templates/article-template.html` vers `blog/{slug}.html`.
2. Remplis chaque endroit marqué `<!-- À REMPLACER : ... -->` dans le
   fichier copié (le gabarit explique quoi mettre à chaque emplacement).
   Points à ne pas oublier :
   - `canonical`, `og:url`, `mainEntityOfPage` doivent tous les trois porter
     la même URL : `https://anarekaci.com/blog/{slug}`.
   - `datePublished` au format `AAAA-MM-JJ` ; `dateModified` = même date à
     la publication, à mettre à jour à chaque correction ultérieure.
   - La première image de l'article garde `loading="eager"` (c'est le LCP
     de la page) ; toutes les images suivantes `loading="lazy"`.
   - `width`/`height` = dimensions réelles du fichier `.webp` utilisé, pas
     une valeur approximative (sinon décalage de mise en page CLS).
   - Les 3 articles de la sidebar "Actualités récentes" : à jour avec les
     3 articles les plus récents du site **hors celui-ci** (voir section 2).

## 2. Mettre à jour le maillage interne

Le nouvel article doit être atteignable depuis 3 endroits. Chacun a sa
propre logique de "3 ou 4 plus récents" — il n'y a pas de génération
automatique, chaque emplacement se modifie à la main.

### a) `blog.html` — page listing

- La carte actuellement en `.blog-card-featured` (la plus récente) devient
  une carte normale dans `.blog-grid`.
- Le nouvel article prend sa place en `.blog-card-featured`.
- Si la catégorie est nouvelle, ajoute une puce dans `.mag-categories`.

### b) `index.html` — bloc "Actualités récentes" (`.album-blog-list`)

- Ce bloc affiche 4 cartes. Ajoute le nouvel article en tête, retire la
  4ᵉ (la plus ancienne) si la liste dépasse 4.

### c) Sidebars des autres articles (`blog/*.html`)

- Chaque article affiche les 3 articles les plus récents **autres que
  lui-même** dans son `<aside class="article-sidebar">`.
- En toute rigueur, publier un nouvel article devrait mettre à jour la
  sidebar de tous les articles dont il fait maintenant partie du "top 3"
  (typiquement les 3 articles immédiatement précédents). En pratique,
  vérifie au minimum les 3 articles les plus récents avant celui-ci et
  ajoute le nouveau lien à leur sidebar (en retirant leur plus ancien lien
  si elle en a déjà 3).

## 3. Mettre à jour `sitemap.xml`

Ajoute une entrée juste après `<url>https://anarekaci.com/blog</url>` :

```xml
<url>
  <loc>https://anarekaci.com/blog/{slug}</loc>
  <lastmod>AAAA-MM-JJ</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
  <image:image>
    <image:loc>https://anarekaci.com/{image-hero}.webp</image:loc>
    <image:title>{légende descriptive de la photo hero}</image:title>
  </image:image>
</url>
```

`changefreq`/`priority` : reprends `monthly`/`0.7`, la convention pour tous
les articles de blog existants (à distinguer des pages permanentes, qui
vont de `0.3` pour les mentions légales à `1.0` pour l'accueil).

## 4. Cache-busting (uniquement si tu as touché `style.css` ou `script.js`)

Un nouvel article seul ne touche ni l'un ni l'autre — cette étape ne
s'applique que si tu en as profité pour modifier le CSS ou le JS du site.
Dans ce cas, incrémente `?v=...` sur **toutes** les pages (le garde-fou CI
`check-page-scaffold` échoue sinon, volontairement).

## 5. Vérifications avant de committer

- **Hiérarchie de titres** : un seul `h1` (le titre de l'article), puis des
  `h2` sans saut de niveau (jamais de `h3` avant un `h2`).
- **JSON-LD valide** : les 2 blocs (`BlogPosting`, `BreadcrumbList`) sont du
  JSON strictement valide — une virgule oubliée après un champ suffit à
  tout casser silencieusement pour les moteurs de recherche.
- **Aucun lien en `.html`** : tous les liens internes (y compris dans le
  JSON-LD, pas seulement les `<a href>`) utilisent l'URL propre
  (`/blog/{slug}`, jamais `/blog/{slug}.html`).
- La CI vérifie automatiquement à la prochaine ouverture de pull request :
  `Validate HTML` (syntaxe), `Check local links & image references`
  (liens et images cassés), `Cohérence du scaffold entre pages` (nav,
  footer, `?v=`, année identiques partout).

## 6. Après publication

- Dans Google Search Console : ressoumets `sitemap.xml` (ou utilise
  "Inspecter l'URL" → "Demander une indexation" pour l'URL du nouvel
  article si tu veux accélérer la découverte).
