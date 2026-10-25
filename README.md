# DUO RUSH — V4.3

Runner coopératif Canvas 2D, deux routes visibles, ville nocturne illustrée conservée de la V3. NÉON IV (femme, veste noire et longs cheveux, électricité bleue) commence en haut ; INDAFRENCH (cagoule blanche, t-shirt noir, cyan/glitch) commence en bas.

## Lancer et jouer

```sh
npm start
```

Serveur statique Python 3, port **8080**, aucun build ni backend. Le site fonctionne également sur GitHub Pages : voir [DEPLOY.md](DEPLOY.md). Les modules ES demandent HTTP/HTTPS, pas une ouverture directe `file://`.

Avant la partie, choisir la vitesse puis **Entrer dans la ville**. L’IA InDaFrench est activée par défaut ; décocher pour jouer à deux au clavier. **Démo · Deux IA** fait réellement jouer les deux personnages, avec toutes leurs collisions actives. Les bonus conservent leur fonctionnement.

| Action            | NÉON IV / touches principales | INDAFRENCH / clavier local secondaire |
| ----------------- | ----------------------------- | ------------------------------------- |
| Saut              | A                             | ↑                                     |
| Glissade          | Z                             | ↓                                     |
| Pouvoir           | E : dash électrique           | → : coup de bouclier                  |
| Arme              | R : arc automatique           | / : épée                              |
| SWITCH            | Espace                        | Espace (second appui local)            |
| Pause / reprendre | Échap ou bouton               | Échap ou bouton                       |

Les commandes restent attachées au personnage après un échange. Le bouton ↻ recommence. L’aide affiche les touches ; lancer une nouvelle partie depuis l’aide remet le niveau à zéro. La pause conserve les timers. Perdre le focus met la partie hôte/locale en pause.

**Cinq vitesses fixes :** Découverte 180, Lente 280, Moyenne 400, Rapide 600, Cauchemardesque 800 px/s. Choix avant la partie, aucune accélération ni modification en cours de partie. Les foulées, la physique et les espacements s’adaptent. Deux cycles de neuf séquences, **137,6 secondes actives** au total ; la distance dépend de la vitesse.

## SWITCH temporaire

1. **Espace uniquement** ouvre la demande de 2 secondes. En clavier local partagé, le second appui sur Espace confirme pour l’autre personnage ; avec l’IA InDaFrench, elle confirme après 0,22 s. À distance, chaque joueur confirme avec Espace sur son ordinateur. Entrée n’est plus une commande du jeu.
2. Confirmation de l’autre : routes échangées pendant **exactement 5 secondes de simulation active**, transition comprise. Compte à rebours visible, pause respectée, impossible de renouveler ou annuler.
3. Retour simultané et automatique sur les routes d’origine. Transition de 0,35 s, protection de 0,45 s.
4. Cooldown **3 secondes à compter du retour**. Une demande expirée impose également 3 secondes d’attente.

L’IA confirme après **0,22 s**, pas immédiatement. Elle peut demander une coopération si un obstacle incompatible approche. Les séquences B/C prévoient un corridor de retour vide ; une demande hors rythme dont le retour pourrait être dangereux est refusée avec « RETOUR NON SÉCURISÉ ». Cette vérification couvre toute la fenêtre de confirmation. Aucun obstacle n’est supprimé pour autoriser un retour.

## Capacités et coopération

- **Néon IV, E :** dash spectral bleu, traînées, éclairs, silhouette lumineuse. Neutralise seulement les murs électriques pendant la durée visible du pouvoir. Cooldown 4 s.
- **InDaFrench, E :** bouclier sorti devant lui, impact, onde et débris. Détruit seulement les barricades blindées compatibles. Cooldown 4 s.
- **Néon IV, R :** arc électrique, sélection automatique de la cible valide la plus proche dans une portée de 1 100 px ; vrai projectile et collision sur la cible. Détruit drones, active interrupteurs et désactive la protection d’un géant. Un interrupteur pédagogique ouvre aussi un passage de l’autre route.
- **InDaFrench, R :** épée à portée de 125 px, frappe active entre 0,40 et 0,64 s après l’action. Détruit les Mâchoires et les géants **déprotégés**. Un coup lancé trop tôt ou contre une protection échoue. Cooldown des armes 1,5 s.

Trois cœurs, invulnérabilité après dégât, bouclier consommable, cœur, recharge et notes à score commun. Un KO termine la partie. Les pouvoirs ne remplacent pas les armes, et aucun personnage ne remplace l’autre.

Les séquences classiques durent désormais **6,8 secondes**, contre 14 auparavant. Les séquences SWITCH réservent 10,6 s au retour sûr et ajoutent une paire d’obstacles à leur sortie : aucun intervalle entre rencontres ne dépasse 6,8 s.

- **A :** pédagogie saut/glissade, pouvoirs propres, arc/drone/interrupteur, puis épée/Mâchoire.
- **B :** blindage haut et caisse basse : échange requis pour attribuer le bouclier au bon parcours.
- **C :** blindage haut et mur électrique bas : double incompatibilité, SWITCH puis deux pouvoirs.
- **D :** géant commun aux deux routes : flèche sur la protection puis épée. Les deux joueurs prennent des dégâts si la créature reste intacte.

## Deux ordinateurs — connexion directe expérimentale

Bouton **Duo à distance**. L’hôte est Néon IV, l’invité InDaFrench. Chacun utilise **A / Z / E / R / Espace** sur son ordinateur.

1. Hôte : créer une partie, envoyer le code affiché à l’invité.
2. Invité : coller ce code, cliquer rejoindre, envoyer son code de réponse à l’hôte.
3. Hôte : coller la réponse et l’utiliser. Quand la connexion est établie, fermer le panneau et lancer la partie.

WebRTC chiffré, connexion pair à pair, aucun serveur applicatif ou compte. L’hôte calcule les collisions et envoie l’état 20 fois/s ; l’invité transmet ses vraies actions. La pause est partagée, une déconnexion met la partie en pause. Les IA sont désactivées en connexion distante. Le service STUN public facilite la connexion directe ; **aucun relais TURN n’est fourni**, donc certains routeurs/réseaux empêchent la connexion. Aucun mode de réseau Internet universel n’est promis. Le test Chromium à deux pages est fourni, mais la connexion réelle est bloquée dans cet environnement : politique gérée `disable_non_proxied_udp`, aucun candidat ICE. Seul le protocole de messages est validé par des tests à canaux simulés. Un essai entre deux ordinateurs réels reste nécessaire.

## Audio et capture

Effets synthétiques originaux, son off par défaut, volume. Le bandeau « TEXT ME BACK — NÉON IV » n’inclut aucune musique protégée. Import MP3/WAV facultatif via URL blob locale ; aucun envoi serveur. Format portrait conservé pour la capture TikTok, avec les deux routes ; commandes clavier, pas de contrôles tactiles.

## Vérification exécutée

```sh
npm ci --ignore-scripts --cache /tmp/neon-npm
npm test
# Serveur actif et /usr/bin/chromium installé :
npm run test:browser
npm run test:network
```

- **29 tests de logique, sprites et protocole** : vitesses, séquences, durée exacte de 5 s, demande expirée, double confirmation, pause, cooldown/retour sûr, quatre capacités, timing épée, mécanisme lié, bonus, KO/reset.
- Une simulation fait finir le niveau aux deux IA **aux cinq vitesses, sans dégât ni impact absorbé par un bouclier**, avec les collisions normales. Aucun HP modifié par l’IA, aucune invincibilité ni suppression d’obstacles. Chaque échange et sa durée sont contrôlés. Cela démontre la solvabilité du catalogue actuel, pas de tous les patterns imaginables ni la facilité humaine.
- Chromium : touches réelles, ressources, projectiles, pause, SWITCH/retour, cinq niveaux IA, démo, paysage et portrait, erreurs console/HTTP.
- Protocole réseau : quatre tests des paquets, actions de l’invité, snapshots et pause sur canaux de données simulés. Le test de connexion WebRTC réelle est **SKIP** : la politique Chromium gérée de ce cloud interdit l’UDP direct et ne produit aucun candidat ICE. La négociation complète, le canal réel et la connexion Internet/NAT restent non validés.

Captures issues de la simulation réelle, sans arrangement des obstacles : `assets/screenshot-v4-landscape.png`, `assets/screenshot-v4-switch.png`, `assets/screenshot-v4-portrait.png`.

## Architecture et direction artistique

`src/game.js` conserve la simulation indépendante du DOM et ajoute les états V4. `config.js` expose vitesses, hitboxes, mapping et capacités. `sequences.js` crée/vérifie le catalogue, `ai.js` exécute les actions réelles, `network.js` porte la connexion directe. `render.js` conserve les couches de ville/sol/pluie existantes et ajoute atlas, monstres, armes et particules ; `main.js` gère interface/clavier/audio.

Les illustrations de ville et les poses existantes sont conservées. Nouveaux atlas RGBA : course, obstacles industriels, Mâchoire. Voir [assets/ART.md](assets/ART.md). Les animations ne remplacent pas les silhouettes par des formes simples. Les armes et effets sont des tracés Canvas superposés aux personnages ; le monstre possède deux repos, trois attaques, morsure, quatre étapes de destruction et deux états de géant.

**Animations V4.2 :** la course conserve les dix poses acceptées et ajoute deux intermédiaires illustrés par personnage : 12 frames. Néon IV dispose de 16 poses d’arc, InDaFrench de 18 poses d’épée et 16 poses de bouclier. Les mains, poignées, armes et sangles sont dans le même dessin ; aucun arc ni bouclier indépendant n’est posé devant le buste. La foulée continue indépendamment de l’animation du haut du corps. Une pose d’arc dont la prise était déconnectée a été écartée et les fragments de cellules voisines ont été nettoyés.

**Limites assumées :** ce sont des illustrations générées, découpées et enregistrées à la taille, pas une animation professionnelle redessinée intégralement à la main. Certains raccords de vêtement, de proportions et de posture peuvent encore être affinés. Les états saut/glissade/dégâts/KO conservent les ressources précédentes ; la V4.2 concentre les nouvelles poses sur la course et les armes. La connexion WebRTC reste expérimentale et non validée dans le cloud, comme expliqué ci-dessus.

## Voir les animations et leurs prises en main

Dans le menu, **Voir les animations** ouvre un aperçu agrandi : choisir la course, l’arc, l’épée, le bouclier ou la flèche. Lecture ralentie, pause et boutons pose précédente/suivante permettent d’examiner chaque main et chaque arme sans attendre une rencontre du niveau. Le jeu est en pause pendant l’observation ; fermer puis reprendre avec le bouton Pause si une partie était en cours.

## Changements visuels V4.2

- Arc tenu bas, levée progressive, armement, tension, lâcher et retour en position basse. La flèche en vol possède un vrai fût, un empennage et une pointe métallique, entourés d’électricité ; elle part à la position de la main et s’oriente vers la cible.
- Épée glitch physiquement tenue par la poignée : dégainé, montée, préparation, coupe et récupération. Bouclier de chevalier attaché à l’avant-bras : prise, levée, protection, percussion et retour.
- Le circuit de la porte est un conduit métallique à coudes, avec identifiant partagé sur capteur et porte. Il devient vert après activation ; l’interrupteur alimenté et l’encadrement ouvert restent visibles.
- Drone de 140 px de large, plus haut (haut du sprite 290 px au-dessus du sol), réacteurs et rayon dangereux sous l’émetteur. La barricade blindée est plus grande, avec emblème de bouclier et débris propres. Une variante organique à trancher apparaît au second passage, avec marque de coupe et séparation animée.
- Vitesses **180 / 280 / 400 / 600 / 800 px/s**, saut d’environ 1,3 s, espaces entre rencontres de 6,8 s maximum, SWITCH uniquement sur Espace et sorts lançables sans cible restent conservés.

Les sources et les PNG sont dans `assets/characters/v42/` et `assets/obstacles/v42/`. `src/animation.js` décrit les dimensions et les cadences ; `src/sprite-compiler-v42.js` enregistre les bustes à la taille et préserve les prises illustrées. Pour reproduire les atlas, serveur actif : `npm run sprites:build`, puis `npm run sprites:contacts`. Le jeu charge les PNG déjà construits. Les planches de contact montrent les mêmes images que le rendu du jeu ; elles permettent une revue visuelle des 50 poses d’armes.

Captures V4.2 : `assets/screenshot-v42-inspector.png` montre l’aperçu réel avec ses commandes ; `assets/screenshot-v42-combat.png` est une scène disposée pour vérifier la prise des armes, le circuit de porte et le drone. Cette dernière n’est pas présentée comme un parcours humain du niveau.


## V4.3 — stabilité et lisibilité

- Notes, bonus et drones : oscillations calculées sur le temps actif et un identifiant stable, jamais sur leur position défilante. Changer la vitesse déplace le monde plus vite sans accélérer leur animation propre.
- Course : retrait du rebond artificiel, cadence limitée à 14–22 poses/s, fondu court entre poses sans perte d’opacité. Recalage horizontal des dessins à la ceinture ; les dessins complets et les armes tenues se déplacent ensemble.
- Dash : 12 nouvelles poses transparentes dédiées, préparation, silhouette électrique, traînée puis rematérialisation. Même durée de pouvoir (0,8 s), mêmes collisions et cooldown ; l’arc existant est conservé. Aperçu ralenti disponible dans « Voir les animations ».
- Épée : une préparation, une frappe, un retour, au lieu des orientations alternant plusieurs fois ; alignement du buste corrigé. Fenêtre active conservée de 0,40 à 0,64 s.
- Caisses, blindages, pics, pylônes, lasers, portes et monstres agrandis avec leurs dimensions de gameplay ; corps des drones et bonus plus visibles. Les cinq niveaux complets restent franchis sans dégâts par l’IA avec les vraies collisions.

Validation V4.3 : 29 tests Node et suite Chromium (24 images chargées, six aperçus, commandes, pause, SWITCH, armes, cinq parcours complets et format portrait), sans erreur de console/HTTP. Les tests de régression couvrent explicitement l’indépendance des oscillations à la vitesse. Les raccords anatomiques de quelques poses de course et des anciens états saut/glissade restent perfectibles ; il n’est pas revendiqué une disparition absolue de toute imperfection.

Captures V4.3 : `assets/screenshot-v4-landscape.png`, `screenshot-v4-switch.png` et `screenshot-v4-portrait.png` proviennent du niveau en cours dans Chromium. `screenshot-v43-inspector.png` montre l’inspecteur réel ; `screenshot-v43-combat.png` est une scène de contrôle disposée pour montrer le dash, la prise d’épée, la liaison porte/interrupteur et le drone agrandi.
