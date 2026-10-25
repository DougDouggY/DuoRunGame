# DUO RUSH — V4.1

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
| SWITCH            | Espace                        | Entrée                                |
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

- **21 tests de logique, sprites et protocole** : vitesses, séquences, durée exacte de 5 s, demande expirée, double confirmation, pause, cooldown/retour sûr, quatre capacités, timing épée, mécanisme lié, bonus, KO/reset.
- Une simulation fait finir le niveau aux deux IA **aux cinq vitesses, sans dégât ni impact absorbé par un bouclier**, avec les collisions normales. Aucun HP modifié par l’IA, aucune invincibilité ni suppression d’obstacles. Chaque échange et sa durée sont contrôlés. Cela démontre la solvabilité du catalogue actuel, pas de tous les patterns imaginables ni la facilité humaine.
- Chromium : touches réelles, ressources, projectiles, pause, SWITCH/retour, cinq niveaux IA, démo, paysage et portrait, erreurs console/HTTP.
- Protocole réseau : quatre tests des paquets, actions de l’invité, snapshots et pause sur canaux de données simulés. Le test de connexion WebRTC réelle est **SKIP** : la politique Chromium gérée de ce cloud interdit l’UDP direct et ne produit aucun candidat ICE. La négociation complète, le canal réel et la connexion Internet/NAT restent non validés.

Captures issues de la simulation réelle, sans arrangement des obstacles : `assets/screenshot-v4-landscape.png`, `assets/screenshot-v4-switch.png`, `assets/screenshot-v4-portrait.png`.

## Architecture et direction artistique

`src/game.js` conserve la simulation indépendante du DOM et ajoute les états V4. `config.js` expose vitesses, hitboxes, mapping et capacités. `sequences.js` crée/vérifie le catalogue, `ai.js` exécute les actions réelles, `network.js` porte la connexion directe. `render.js` conserve les couches de ville/sol/pluie existantes et ajoute atlas, monstres, armes et particules ; `main.js` gère interface/clavier/audio.

Les illustrations de ville et les poses existantes sont conservées. Nouveaux atlas RGBA : course, obstacles industriels, Mâchoire. Voir [assets/ART.md](assets/ART.md). Les animations ne remplacent pas les silhouettes par des formes simples. Les armes et effets sont des tracés Canvas superposés aux personnages ; le monstre possède deux repos, trois attaques, morsure, quatre étapes de destruction et deux états de géant.

**Animations V4.1 :** chaque personnage possède un atlas PNG de 10 étapes de course et 10 étapes de course armée, plus deux lignes de couches séparées. La pose de contact opposée a été illustrée explicitement : jambe proche à couture cyan derrière, autre jambe devant. Les corps/armes et les bas de corps sont assemblés avec des repères fixes ; en jeu, les jambes poursuivent la foulée à la vitesse courante pendant que le haut du corps exécute le tir ou le coup ; certains intermédiaires de jambes sont réutilisés. Les atlas ne sont pas une animation dessinée intégralement à la main. Les raccords de taille, de vêtement et la boucle restent perfectibles. Les poses intermédiaires saut/glissade/récupération sont encore peu nombreuses ; dégâts et KO réutilisent des ressources V3, sans mort complète spécifique à chaque cause. Les dix poses illustrées de sortie/tension/tir/rangement d’arc et de dégainé/frappe/récupération d’épée gardent une foulée alternée. Le bouclier est une grande illustration de type chevalier, superposée au corps. Les atlas générés peuvent garder de légers halos ; l’animation n’est pas un pack professionnel finalisé. Le réseau distant est expérimental sans relais. Un playtest humain prolongé à deux et un test sur deux connexions Internet restent à faire.

## Changements de jeu V4.1

- Le saut dure environ **1,3 seconde**, à toutes les vitesses ; sa hauteur est d’environ 169 px. La glissade dure 1,1 s et E reste visible 0,8 s.
- E et R peuvent être lancés sans obstacle et pendant les autres actions, sous réserve de leur cooldown. R tire aussi dans le vide : dix étapes sur 0,8 s, flèche réellement créée au lâcher (étape 7, à 0,56 s), puis vol à 1 600 px/s. L’IA adapte le début de son coup d’épée à la vitesse et à la nouvelle préparation.
- L’interrupteur est au **plafond**, 260 px devant sa porte. Le tir l’active ; la porte liée se rétracte puis disparaît. Le câble lumineux rend le lien lisible. L’interrupteur n’inflige jamais de dégâts au sol.
- Le drone vole en hauteur et projette un rayon rouge jusqu’au sol. Son rayon est dangereux ; détruire le drone coupe immédiatement le laser. Les portes et drones exigent des flèches, pas le dash ou le bouclier.
- Les caisses passent à **66 × 68 px**, avec illustration et bordure ambre contrastée.
- Les sources et PNG finaux sont dans `assets/characters/v41/`. Pour rebâtir les sprites après modification des poses : serveur actif, puis `npm run sprites:build`. Les fichiers JSON indiquent les repères et les poses droite/gauche. Le jeu charge les PNG déjà compilés ; aucun outil de génération n’est nécessaire pour jouer.

`assets/screenshot-v41-combat.png` est une scène de contrôle disposée pour inspecter l’arc, le bouclier, la porte et le drone ; elle n’est pas une preuve de parcours humain. Les captures de niveau proviennent de la simulation réelle.
