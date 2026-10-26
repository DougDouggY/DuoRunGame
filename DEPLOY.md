# Publication DUO RUSH V4.4

GitHub Pages est activé sur le dépôt. Source vérifiée : branche `gh-pages`, racine `/`.

Adresse du jeu : https://dougdouggy.github.io/DuoRunGame/

Le jeu est statique, avec `.nojekyll`. Aucun build, backend ni secret nécessaire. La coop à distance utilise une connexion WebRTC directe expérimentale, et non un serveur applicatif.

Pour publier une évolution validée : envoyer le commit sur `gh-pages`, attendre le build Pages et vérifier que le titre distant est **DUO RUSH — V4.4**, que la métadonnée `version` vaut `4.4.0` et que les 25 images chargent dans un navigateur. Les URLs des modules et du CSS portent un suffixe de version pour éviter de reprendre les scripts V3 du cache.

Contrôles locaux avant publication : `npm test`, serveur `npm start`, puis `npm run test:browser` et `npm run test:audio`. `npm run test:network` rend explicitement SKIP quand Chromium ne propose aucune route ICE ; ce n’est pas une validation du multijoueur distant.

Les domaines `api.github.com` et `dougdouggy.github.io` sont désormais accessibles depuis l’environnement pour vérifier le déploiement. La publication du jeu sur GitHub Pages est distincte de la publication du snapshot de développement cloud.
