## Changements

<!-- Que change cette PR, et pourquoi ? -->

## Liste de contrôle

- [ ] `npm run check` passe (scaffold, hreflang, CSP, contenu, JSON-LD, sitemap, blog, hygiène)
- [ ] `style.css` ou `script.js` modifié ? → `?v=` mis à jour sur **toutes** les pages (FR et EN)
- [ ] Script inline modifié ? → nouveau hash copié dans `_headers`
- [ ] Nouvel article ? → carte `blog/index.html`, `index.html`, barres latérales, entrée `sitemap.xml`, catégorie existante, vraies dimensions d'images (voir `templates/GUIDE-PUBLICATION-ARTICLE.md`)
- [ ] Nouvelle origine externe (script, style, police, iframe, API) ? → ajoutée à la CSP dans `_headers`
- [ ] Miroir EN mis à jour, ou changement FR-seulement volontaire
- [ ] Nouvelle animation continue ? → elle s'arrête avec « pause des animations » et `prefers-reduced-motion`
- [ ] Aucun secret ni note privée (tout le dépôt est public)

## Captures (FR / EN, mobile si pertinent)

<!-- Avant / après -->
