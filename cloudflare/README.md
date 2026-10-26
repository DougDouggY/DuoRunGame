# Activer les salles privées DUO RUSH

Le code du relais et de la connexion par invitation est implémenté. Le déploiement sur votre compte Cloudflare nécessite votre authentification ; aucune adresse de serveur n’est inventée dans le jeu.

## Ce que vous utiliserez avec Tony

1. Dans le jeu, ouvrir **DUO À DISTANCE**.
2. Hôte : dans **Configurer la connexion**, renseigner l’adresse HTTPS du relais (automatique après publication de `online-config.js`) et votre **clé de création privée**, puis **Créer une salle**.
3. Copier le lien privé et l’envoyer à Tony. Le lien est une clé d’invitation : ne pas le publier.
4. Tony ouvre le lien, clique **Rejoindre** ; il joue INDAFRENCH, l’hôte joue NÉON IV. Il n’a pas besoin de la clé de création.
5. Fermer le panneau ; l’hôte lance la partie. Chacun utilise A / Z / E / R / Espace sur son ordinateur.

La salle est limitée à deux joueurs. Une déconnexion suspend la partie ; l’invité peut rejoindre le même lien. **Reprendre ma salle** récupère le rôle hôte grâce au navigateur qui l’a créée. Si l’hôte recharge/ferme sa page, sa simulation n’est pas conservée : il doit lancer une nouvelle partie après reconnexion. Pas de migration d’hôte ni de sauvegarde de partie sur le serveur.

Chaque joueur importe sa musique et règle son son sur son propre ordinateur ; aucun fichier audio ne traverse le relais. Les obstacles, vies, score commun et SWITCH sont calculés par l’hôte, puis partagés. Les notes personnelles restent locales.

## Déploiement depuis cet environnement Codex

Dans les **paramètres sécurisés de l’environnement**, fournir :

- `CLOUDFLARE_API_TOKEN` (secret) : jeton Cloudflare permettant de modifier les Workers du compte choisi. Ne pas utiliser la clé API globale. Le modèle **Edit Cloudflare Workers** est une base pratique ; restreindre au compte du jeu et ne pas ajouter de zone DNS pour un domaine personnalisé inutile.
- `CLOUDFLARE_ACCOUNT_ID` (variable non secrète) : identifiant du compte affiché dans le tableau de bord Cloudflare.
- `ROOM_CREATION_KEY` (secret) : phrase privée longue que vous choisissez pour créer vos salles. Vous saisirez cette même phrase dans le jeu côté hôte. Elle n’est jamais ajoutée aux fichiers publics.

Créer le jeton sur https://dash.cloudflare.com/profile/api-tokens ; trouver l’identifiant du compte dans https://dash.cloudflare.com/ . **Ne coller aucun secret dans le chat, dans le dépôt ou dans une URL.**

Une fois ces paramètres fournis :

```sh
npm ci --ignore-scripts --cache /tmp/neon-npm
npm run online:check
npm run online:build
npm run online:deploy
```

`online:deploy` déploie `duo-rush-relay`, configure la clé via l’API Cloudflare, vérifie `/health`, puis écrit **uniquement l’adresse publique** dans `src/online-config.js`. Il faut ensuite publier les fichiers statiques du jeu sur la branche `gh-pages`. Le déploiement du relais et celui de GitHub Pages sont deux opérations distinctes.

Le script cible explicitement votre authentification normale. Il n’utilise pas de compte de démonstration temporaire et n’active aucun abonnement payant. Un échec pour quota, permissions ou compte manquant doit être résolu sur votre compte, pas contourné en choisissant une offre payante.

## Alternative depuis votre ordinateur

Avec Git, Node 22.17+ (Node 24 conseillé) et Python 3 :

```sh
git clone https://github.com/DougDouggY/DuoRunGame.git
cd DuoRunGame
npm ci
npm run online:login
npm run online:deploy
```

Le navigateur vous connecte à Cloudflare. La création du jeton manuel est alors inutile. Le script de déploiement vous invite dans votre terminal à saisir la clé privée du jeu via Wrangler. Il faut toujours publier le changement de `src/online-config.js` sur GitHub Pages, ou saisir l’adresse du serveur dans le jeu.

## Tester sans compte Cloudflare

Trois terminaux depuis la racine du dépôt :

```sh
npm start
npm run online:dev
npm run test:online
```

Le premier sert le jeu sur le port 8080 ; le second démarre le moteur Cloudflare local sur le port 8787. Le relais local utilise une clé de test **locale uniquement**, `local-duo-test`. Les salles locales sont éphémères. `test:online` lance deux navigateurs indépendants avec de vraies connexions WebSocket, sans nécessiter WebRTC/UDP ni compte Cloudflare.

Autres contrôles : `npm test` (dont tests natifs des Durable Objects), `npm run test:browser`, `npm run test:audio`, `npm run online:build`.

## Fonctionnement et limites

- Worker public + **Durable Object SQLite** par salle, compatible avec le modèle de ressources du plan gratuit.
- Une clé protège la création de salles ; le code de salle possède 128 bits aléatoires, le rôle hôte un jeton séparé de 256 bits. Le jeton hôte est conservé dans la session du navigateur et jamais inclus dans le lien d’invitation.
- Adresses HTTPS exigées, sauf boucle locale de développement ; origines du jeu explicitement autorisées dans `CLIENT_ORIGINS`.
- Au plus 20 états/s pendant la partie. Aucun état répété pendant la pause ; un ping natif à réponse automatique maintient la liaison sans réveiller le DO.
- Hibernation WebSocket, aucune boucle de simulation serveur, aucune écriture en base par image. Métadonnées de salle seulement à la création, suppression après six heures. Expiration absolue : créer une nouvelle salle ensuite.
- Plafonds de paquets (48 Kio) et de cadence (30 messages/s hôte, 15/s invité) contre erreurs et rafales ; troisième connexion refusée, actions/paquets de rôle incorrect ignorés.
- L’hôte reste l’autorité : il peut tricher sur sa propre partie. Ce relais n’est pas un serveur compétitif anti-triche.
- Interpolation de rendu de l’invité, retard d’environ 80 ms ; elle ne modifie pas la simulation ni la durée du SWITCH. Une forte latence doit encore être évaluée entre vos deux ordinateurs.
- Les tests locaux ne valident pas à eux seuls un compte, un quota ni un déploiement Cloudflare Internet. Vérifier le point d’entrée déployé, puis faire une partie à deux sur vos réseaux réels.

Voir `NETWORK_BUDGET.md` pour les estimations de trafic, requêtes et durée. Les dépenses éventuelles des autres jeux du même compte restent à additionner.
