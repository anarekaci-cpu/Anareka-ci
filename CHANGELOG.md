# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), regroupé par mois
(le site n'a pas de numéros de version). Une entrée par changement qui mérite un déploiement.

## [Non publié]

### Ajouté
- Contrôles automatiques : contenu (chemins, images, emojis, titres), JSON-LD/canonical, sitemap, maillage du blog, hygiène du dépôt (LF, `security.txt`), limite de pages sans build.
- Tests de bout en bout Playwright (pages sans erreur ni violation CSP, formulaire FR/EN, lightbox, pause des animations, menu mobile).
- Dependabot (actions + npm), modèle de pull request, `.editorconfig`, `/.well-known/security.txt`.
- En-têtes `X-Robots-Tag: noindex` sur les fichiers du dépôt servis sans intérêt pour la recherche.

### Modifié
- Performance mobile : plus de pulsation lumineuse par carte du bandeau photo, bandeau en pause hors écran, flou d'arrière-plan retiré sur petits écrans et là où le fond est quasi opaque.
- Page d'adhésion : formulation unique sur la fondation (« Fondée en 2025, … prolonge le travail du SYNAREK-CI, actif depuis 1996 »).
- `sitemap.xml` : articles triés par date de publication.
- CI : un seul job « garde-fous » (`npm ci` + `npm run check`), job e2e.

## 2026-10

### Ajouté
- Page `/en/adhesion` (FR/EN en paire hreflang) ; bouton « mettre en pause les animations » ; messages d'erreur du formulaire accessibles.

### Modifié
- Accessibilité (WCAG 2.2) : focus, contrastes, contrôles invisibles hors de l'ordre de tabulation, mouvement réduit.
- Robustesse de `script.js` ; JSON-LD relié ; CI durcie (permissions minimales, actions épinglées).
- Fins de ligne LF forcées (`.gitattributes`).
