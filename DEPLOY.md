# Publication DUO RUSH V4.5.1

GitHub Pages est activé sur le dépôt. Source vérifiée : branche `gh-pages`, racine `/`.

Adresse du jeu : https://dougdouggy.github.io/DuoRunGame/

Le client est statique, avec `.nojekyll`. La coop locale n’a pas besoin de backend. La coop à distance V4.5.1 utilise le relais Cloudflare de `cloudflare/worker.js` ; son déploiement est une opération séparée, nécessitant un compte autorisé. Aucun secret ne doit entrer dans le client, les captures ou Git. Voir [cloudflare/README.md](cloudflare/README.md).

Pour publier une évolution validée : envoyer le commit sur `gh-pages`, attendre le build Pages et vérifier que le titre distant est **DUO RUSH — V4.5.1**, que la métadonnée `version` vaut `4.5.1` et que les 25 images chargent dans un navigateur. Les URLs des modules et du CSS portent un suffixe de version pour éviter de reprendre les scripts V3 du cache.

Contrôles locaux avant publication : `npm test`, serveur `npm start`, puis `npm run test:browser` et `npm run test:audio`. Pour le relais : serveur `npm run online:dev`, puis `npm run test:online` et `npm run online:build`. `npm run test:network` rend explicitement SKIP quand Chromium ne propose aucune route ICE ; ce n’est pas une validation du multijoueur distant.

Les domaines `api.github.com` et `dougdouggy.github.io` sont désormais accessibles depuis l’environnement pour vérifier le déploiement. La publication du jeu sur GitHub Pages est distincte de la publication du snapshot de développement cloud.

Après accès au compte Cloudflare : `npm run online:check`, puis `npm run online:deploy`. Le script configure la clé privée, vérifie `/health` sur l’adresse retournée par Cloudflare et enregistre uniquement cette adresse dans `src/online-config.js`. Publier ensuite le client et vérifier les fichiers servis. Tester enfin une partie réelle depuis les deux réseaux des joueurs ; ne pas présenter les tests locaux comme ce test Internet.

Relais actuel : https://duo-rush-relay.jeferson-patry-sin.workers.dev . `/health` a été vérifié en HTTPS avec `configured:true`. `src/online-config.js` contient cette adresse publique, sans clé. Les connexions de jeu complètes sont validées localement ; l’essai de vos deux ordinateurs reste distinct.
