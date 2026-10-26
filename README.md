# DUO RUSH — V4.4.1

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

**Cinq vitesses de départ :** Découverte 180, Lente 350, Moyenne 600, Rapide 800, Cauchemardesque 1 000 px/s. Les douze premières secondes restent à la vitesse choisie, puis elle monte continûment jusqu’à +25 % à 90 s (225 / 438 / 750 / 1 000 / 1 250 px/s). La pause suspend cette progression. La fonction de distance est intégrée pour déplacer chaque obstacle continûment, sans saut de position. Deux cycles de neuf séquences, **137,6 secondes actives** ; la densité augmente aussi avec la progression.

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
- **InDaFrench, R :** épée à portée de 125 px, frappe active entre 0,40 et 0,64 s après l’action. Détruit les Mâchoires et les géants **déprotégés**. Un coup lancé trop tôt ou contre une protection échoue. Cooldown épée 1,5 s ; arc de 0,9 s à environ 0,35 s selon la vitesse, calculé au début du tir.

Trois cœurs, invulnérabilité après dégât, bouclier consommable, cœur, recharge et notes à score commun. Un KO termine la partie. Les pouvoirs ne remplacent pas les armes, et aucun personnage ne remplace l’autre.

Les séquences principales conservent leur rythme pédagogique ; **64 obstacles classiques supplémentaires** remplissent progressivement les intervalles, pour **106 obstacles dangereux au total** (la créature géante commune compte une fois). Les passages classiques tardifs descendent à environ **1,7 s** entre rencontres. Les séquences SWITCH réservent leur corridor de retour : aucun obstacle n’est supprimé et aucun remplissage n’y est introduit.

- **A :** pédagogie saut/glissade, pouvoirs propres, arc/drone/interrupteur, puis épée/Mâchoire.
- **B :** blindage haut et caisse basse : échange requis pour attribuer le bouclier au bon parcours.
- **C :** blindage haut et mur électrique bas : double incompatibilité, SWITCH puis deux pouvoirs.
- **D :** géant commun aux deux routes : flèche sur la protection puis épée. Les deux joueurs prennent des dégâts si la créature reste intacte.

## Deux ordinateurs — connexion directe expérimentale

Bouton **Duo à distance**. L’hôte est Néon IV, l’invité InDaFrench. Chacun utilise **A / Z / E / R / Espace** sur son ordinateur.

1. Hôte : créer une partie, envoyer le code affiché à l’invité.
2. Invité : coller ce code, cliquer rejoindre, envoyer son code de réponse à l’hôte.
3. Hôte : coller la réponse et l’utiliser. Quand la connexion est établie, fermer le panneau et lancer la partie.

WebRTC chiffré, connexion pair à pair, aucun serveur applicatif ou compte. L’hôte calcule les collisions et envoie l’état au maximum 20 fois/s ; l’invité transmet ses vraies actions. La pause est partagée, une déconnexion met la partie en pause. Les IA sont désactivées en connexion distante. Le service STUN public facilite la connexion directe ; **aucun relais TURN n’est fourni**, donc certains routeurs/réseaux empêchent la connexion. Aucun mode de réseau Internet universel n’est promis. Le test Chromium à deux pages est fourni, mais la connexion réelle est bloquée dans cet environnement : politique gérée `disable_non_proxied_udp`, aucun candidat ICE. Seul le protocole de messages est validé par des tests à canaux simulés. Un essai entre deux ordinateurs réels reste nécessaire.

## Audio et capture

Effets synthétiques originaux, son off par défaut, volume. Le bandeau « TEXT ME BACK — NÉON IV » n’inclut aucune musique protégée. Import MP3/WAV facultatif via URL blob locale ; aucun envoi serveur. Format portrait conservé pour la capture TikTok, avec les deux routes ; commandes clavier, pas de contrôles tactiles.

## Vérification exécutée

```sh
npm ci --ignore-scripts --cache /tmp/neon-npm
npm test
# Serveur actif et /usr/bin/chromium installé :
npm run test:browser
npm run test:audio
npm run test:network
```

- **38 tests de logique, sprites, rythme et protocole** : vitesses, séquences, durée exacte de 5 s, demande expirée, double confirmation, pause, cooldown/retour sûr, quatre capacités, timing épée, mécanisme lié, bonus, KO/reset.
- Une simulation fait finir le niveau aux deux IA **aux cinq vitesses, sans dégât ni impact absorbé par un bouclier**, avec les collisions normales. Aucun HP modifié par l’IA, aucune invincibilité ni suppression d’obstacles. Chaque échange et sa durée sont contrôlés. Cela démontre la solvabilité du catalogue actuel, pas de tous les patterns imaginables ni la facilité humaine.
- Chromium : touches réelles, ressources, projectiles, pause, SWITCH/retour, cinq niveaux IA, démo, paysage et portrait, erreurs console/HTTP.
- Protocole réseau : six tests des paquets, actions de l’invité, snapshots et pause sur canaux de données simulés. Le test de connexion WebRTC réelle est **SKIP** : la politique Chromium gérée de ce cloud interdit l’UDP direct et ne produit aucun candidat ICE. La négociation complète, le canal réel et la connexion Internet/NAT restent non validés.

Captures issues de la simulation réelle, sans arrangement des obstacles : `assets/screenshot-v4-landscape.png`, `assets/screenshot-v4-switch.png`, `assets/screenshot-v4-portrait.png`.

## Architecture et direction artistique

`src/game.js` conserve la simulation indépendante du DOM et ajoute les états V4. `config.js` expose vitesses, hitboxes, mapping et capacités. `sequences.js` crée/vérifie le catalogue, `ai.js` exécute les actions réelles, `network.js` porte la connexion directe. `render.js` conserve les couches de ville/sol/pluie existantes et ajoute atlas, monstres, armes et particules ; `main.js` gère interface/clavier ; `audio.js` synthétise les effets et lit le fichier personnel, `rhythm.js` suit les mesures/kicks et notes locales, `pace.js` porte la progression et les timings de tir.

Les illustrations de ville et les poses existantes sont conservées. Nouveaux atlas RGBA : course, obstacles industriels, Mâchoire. Voir [assets/ART.md](assets/ART.md). Les animations ne remplacent pas les silhouettes par des formes simples. Les armes sont peintes dans leurs sprites avec la prise des mains, complétées par les effets Canvas ; le monstre possède deux repos, trois attaques, morsure, quatre étapes de destruction et deux états de géant.

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

Captures courantes V4.4 : `assets/screenshot-v4-landscape.png`, `screenshot-v4-switch.png` et `screenshot-v4-portrait.png` proviennent du niveau en cours dans Chromium. Les captures nommées v43 restent historiques. `screenshot-v43-inspector.png` montre l’inspecteur réel ; `screenshot-v43-combat.png` est une scène de contrôle disposée pour montrer le dash, la prise d’épée, la liaison porte/interrupteur et le drone agrandi.


## V4.4 — rythme, audio personnel et deux quartiers

L’arc garde exactement ses 16 poses et ses dessins V4.2. Sa durée et son cooldown sont capturés au début de chaque tir : environ 0,45 s avant relâchement en Découverte, jusqu’à 0,18 s à haute vitesse. La flèche est un projectile réel ; épée, dash, bouclier et SWITCH conservent leurs propres fenêtres.

Activer **SON ON** pour les nouveaux bruitages synthétisés : flèche, épée, impact, explosion, mort de créature, électricité, bouclier, SWITCH et bonus. Aucun fichier sonore externe ni musique incluse. Les événements sonores partagés sont transmis à l’invité via les snapshots ; chaque appareil les joue à son propre volume.

Chaque navigateur importe son propre MP3/WAV. Le fichier est lu par URL blob et reste sur cet appareil ; ni le fichier, ni l’analyse audio, ni le compteur personnel ne sont transmis par le réseau. Choisir « Notes perso → Toutes les 2 mesures » et régler le **BPM** du morceau (4 temps par mesure, donc une apparition tous les 8 temps). Le mode « Tous les 8 kicks » utilise les transitoires graves 40–180 Hz ; il est expérimental, sans promesse de transcription parfaite sur tous les morceaux. Les notes personnelles cyan apparaissent sur la musique locale, traversent la piste du personnage local et ont leur propre compteur avec contact de hauteur/piste réel ; les notes dorées du niveau et le score coop restent communs. Pause, boucles et changement de fichier ne créent pas de rafale de notes.

Le haut garde sa ville d’origine ; le bas utilise une illustration distincte de canaux et voies suspendues (`assets/backgrounds/canal.png`), avec sa propre couche proche. Les personnages et les dessins acceptés sont conservés.

Tests exécutés : **38 tests Node**, suite Chromium complète aux cinq vitesses avec accélération et densification (zéro impact), et suite audio séparée : deux imports WAV indépendants, zéro requête d’envoi, génération réelle de notes via BPM et via analyseur de kicks, pause/reprise/volume et **11 bruitages synthétisés rendus en PCM non silencieux**. Ce test valide la chaîne de synthèse, pas une appréciation subjective de mixage. La connexion WebRTC Internet reste expérimentale et n’est pas validée par les canaux simulés. Voir [NETWORK_BUDGET.md](NETWORK_BUDGET.md) pour les estimations Cloudflare.


## V4.4.1 — quartier supérieur réillustré

La piste haute utilise désormais `assets/backgrounds/rooftops.png` : terrasses techniques, tours vitrées, passerelles, façades magenta et reflets de pluie. L’illustration a la même résolution et le même traitement que le quartier des canaux du bas, qui est conservé. Le décor reste défilant en parallaxe, derrière les obstacles et personnages ; il ne s’agit pas d’un écran concept collé au jeu. L’ancien fichier `city.png` reste disponible comme ressource historique. Aucun timing de gameplay, personnage ou arme n’a été modifié dans cette révision.

La comparaison entre tour par tour et coop temps réel ainsi qu’un exemple chiffré de deux heures pour deux joueurs sont détaillés dans [NETWORK_BUDGET.md](NETWORK_BUDGET.md). Aucun backend Cloudflare n’est ajouté par ce changement visuel.
