# NEON RUSH — V3 Classique

Jeu navigateur Canvas 2D, coop locale pour deux personnes. Aucun compte, serveur applicatif, API ou abonnement. Les deux parcours restent visibles. Niveau classique de 2 400 m, vitesse fixe **Découverte** par défaut, environ six minutes.

## Jouer

Depuis ce dossier :

```sh
npm start
```

Le serveur HTTP statique écoute sur le port **8080**. Ouvrir ce port avec le navigateur local / l'outil d'accès de votre environnement, puis cliquer **Entrer dans la ville**. Python 3 suffit au lancement ; Node 20+ sert aux tests. Ne pas ouvrir directement le fichier HTML avec `file://` : les modules ES nécessitent HTTP.

| Action           | NÉON IV (femme, capuche noire) | SWONNI (homme, cagoule blanche) |
| ---------------- | ------------------------------ | ------------------------------- |
| Saut             | Z                              | ↑                               |
| Glissade         | S                              | ↓                               |
| Pouvoir          | A                              | →                               |
| Confirmer SWITCH | E                              | Entrée                          |

E et Entrée dans une fenêtre de **1,4 seconde** échangent les pistes. Les collisions sont protégées pendant la transition de 0,65 s. Les commandes suivent le personnage après l'échange. Chaque joueur dispose de trois cœurs et de 1,8 s d'invulnérabilité après un impact. Le KO de l'un termine la partie.

- **Néon IV** traverse les murs électriques bleus avec son dash spectral ; elle ne brise pas le blindage rose.
- **Swonni** brise les caisses blindées roses avec sa frappe glitch ; il ne neutralise pas les murs bleus.
- Activer au moment du passage, cooldown de quatre secondes. Pour les patterns inversés, SWITCH puis pouvoir.
- Sauter caisses, pics et trous. Glisser sous les barrières et lasers. Les trous demandent un saut plus tardif que les caisses.
- Notes : +25 points partagés ; obstacle spécial neutralisé : +100 ; cœur : soin ; bouclier : absorbe un impact ; énergie : réinitialise le cooldown.
- Espace / Échap et bouton Pause ; bouton ↻ pour recommencer ; aide des touches.
- Lente / Moyenne / Rapide / Cauchemardesque sont facultatives. Aucun changement automatique de vitesse. Les actions s'adaptent à la vitesse ; les patterns gardent leur temps de préparation.

**Audio :** effets synthétiques originaux désactivés par défaut. Le bandeau « TEXT ME BACK — NÉON IV » est un intitulé visuel, pas une musique incluse. Import MP3/WAV facultatif, lecture par URL blob locale, volume, son on/off. Aucun fichier audio n'est envoyé au serveur.

## Vérification

```sh
npm ci --ignore-scripts --cache /tmp/neon-npm
npm test
# Avec le serveur déjà lancé, Chromium disponible dans /usr/bin/chromium :
npm run test:browser
```

12 tests de logique : actions, collisions, cooldown, SWITCH valide/expiré, protection, bonus, pause, reset, KO et fin. Le test de parcours intégral simule un duo synchronisé sur **les cinq vitesses**, sans dégâts, jusqu'à la fin : il démontre la possibilité des patterns, pas leur facilité pour un humain. Chromium contrôle les ressources, les touches, le saut, la glissade, les pouvoirs, le SWITCH, pause/reset et deux tailles. Aucun test ne remplace un playtest humain à deux.

Captures en cours de partie : `assets/screenshot-landscape.png` et `assets/screenshot-portrait.png`. La scène de la capture est arrangée pour montrer les différents éléments ; le défilement et les personnages restent actifs. Ce n'est pas une preuve d'un parcours humain de 427 m.

## Structure et remplacement artistique

- `src/game.js` : simulation sans dépendance DOM ; états, collisions, coop, score.
- `src/config.js` : dimensions, paramètres, patterns et mapping de sprites.
- `src/render.js` : Canvas, parallaxe, pluie, HUD, poses et effets.
- `src/assets.js` : chargement et vérification des images.
- `src/main.js` : clavier, interface, audio local et boucle.
- `assets/backgrounds/` : panorama illustré et sol séparés, défilant à des vitesses distinctes.
- `assets/characters/actions.png` : véritable atlas RGBA dérivé, 5 colonnes × 4 lignes, dix poses par personnage. Modifier `SPRITES` pour enrichir les frames, sans modifier le gameplay.

## État artistique honnête

La référence composite jointe au chat a été examinée. Les fichiers annoncés `assets/01_direction_artistique.png`, `02_neon_iv_reference.png` et `03_swonni_reference.png` **n'étaient pas présents dans le dépôt** au moment de l'implémentation. L'image jointe n'a donc pas été inventée sous ces noms. Deux ressources illustrées ont été générées à partir de son design visible, et leurs originaux sont conservés (`assets/generated-atlas.png`, `assets/characters/actions.png`). Voir `assets/ART.md`.

Le rendu jouable comprend une ville nocturne illustrée, néons, pluie, reflets, deux plateformes, personnages humains détourés, HUD et effets. Le concept n'est jamais utilisé comme fond unique contenant les personnages et obstacles.

Écarts : les obstacles sont encore dessinés en Canvas et moins détaillés que le concept ; les décors se répètent ; la course comporte seulement deux images très proches et manque de fluidité ; dégâts et KO partagent la dernière pose. Le détourage de l'atlas RGBA est exploitable, avec un halo cyan volontaire et quelques résidus sur les contours ; le premier détourage chromatique est conservé pour les portraits. Les silhouettes respectent les designs visibles, mais les deux références individuelles restent nécessaires pour contrôler exactement le visage, la cagoule et la veste. L'inscription « NÉON IV » n'est pas lisible sur le sprite actuel. Ce sont des assets de prototype illustré, pas une spritesheet professionnelle finalisée.

À illustrer ensuite : cycle de course de 8–12 frames, dégâts et KO distincts, glissade plus basse, obstacles texturés, portraits dédiés et variantes de quartier. Le portrait conserve les deux pistes et les proportions des personnages ; il reste destiné à la capture avec clavier PC, sans commandes tactiles.

## Mise à jour Néon IV et publication

La référence individuelle de Néon IV a ensuite été reçue dans le chat : le jeu utilise maintenant `assets/characters/neon-actions.png`, dix poses dérivées avec veste ample, visage caché, cheveux longs et aura bleu électrique. `SPRITES.neonGrid` décrit les cadres et exclut les séparations résiduelles de l’image générée. Le portrait a été remplacé. La référence individuelle de Swonni reste attendue.

Pour GitHub Pages, voir [DEPLOY.md](DEPLOY.md). La branche de publication est `gh-pages`. Une branche envoyée ne prouve pas que Pages a été activé.
