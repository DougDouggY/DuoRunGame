# Provenance et découpage

Référence visuelle : image composite reçue dans le chat, montrant Néon IV, Swonni, pouvoirs, exemples et scène centrale. Aucun fichier des trois références nommées n'était présent dans `assets/` ; ne pas confondre nos dérivés avec les originaux de l'utilisateur.

`generated-atlas.png` : illustration générée depuis cette référence, 1536×1024. Région haute utilisée pour le panorama, bande de sol séparée, région basse pour les portraits. Aucun panneau de présentation du concept n'est dessiné dans le jeu.

Découpage initial avec ImageMagick, vérifications TLS inchangées :

```sh
convert assets/generated-atlas.png -crop 1536x320+0+0 +repage assets/backgrounds/city.png
convert assets/generated-atlas.png -crop 1536x120+0+535 +repage assets/backgrounds/ground.png
convert assets/generated-atlas.png -crop 600x360+100+660 +repage -fuzz 22% -transparent '#00ff00' -trim +repage assets/characters/neon.png
convert assets/generated-atlas.png -crop 520x360+800+660 +repage -fuzz 22% -transparent '#00ff00' -trim +repage assets/characters/swonni.png
```

`characters/actions.png` : deuxième génération depuis le premier atlas inspecté, sortie RGBA avec canal alpha réel. Grille 5×4 ; lignes 1–2 Néon IV, lignes 3–4 Swonni. Pour chaque personnage : course A, course B, impulsion, saut, chute, atterrissage, glissade, pouvoir, SWITCH, dégâts/KO. Le rendu choisit des cadres distincts sans étirer une pose. Le cycle reste limité à deux frames ressemblantes ; ce n'est pas un animation pack professionnel. Les effets électriques/glitch sont dessinés séparément et le mouvement du SWITCH vient du gameplay.

La capture comparée au concept confirme la palette et les silhouettes, mais aussi les limites détaillées dans le README. Les références individuelles à venir devront être intégrées et comparées ; aucune fidélité parfaite n'est revendiquée.

## Deuxième référence reçue

Le portrait individuel transmis ensuite dans le chat montre une femme encapuchonnée de dos/trois-quarts, longs cheveux noirs, veste ample noire marquée IV sur le bras, halo et éclairage bleu électrique au-dessus d'une ville nocturne. Cette référence remplace le rose comme couleur d'identité de Néon IV ; le rose reste présent dans le quartier et chez Swonni. Le poster complet n'est pas utilisé comme personnage ni comme fond de jeu. Le fichier original du chat n'étant pas monté comme fichier dans le dépôt, les poses adaptées sont des illustrations dérivées, pas des découpages prétendument extraits du fichier original.

## Ressources V4 — DUO RUSH

- `characters/run-v4.png` : atlas RGBA 6 colonnes, quatre rangées. 12 images de Néon IV et 11 images d’InDaFrench utilisées. La cellule index 21 représente à tort Néon IV et est expressément exclue de `RUN_SPRITES.frames[1]`. Les rangées sont décrites par leurs limites réelles, et non supposées parfaitement régulières. Les sprites V3 restent disponibles pour les autres états.
- `monsters/maw.png` : atlas RGBA 4×3. Frames 0–1 : repos ; 2–4 : ouverture/fermeture d’attaque ; 5 : morsure ; 6–9 : destruction ; 10 : géant protégé ; 11 : géant déprotégé. Créature végétale sombre originale, crocs translucides et veines magenta/cyan. Le géant conserve les proportions de l’illustration et occupe les deux routes.
- `obstacles/industrial.png` : atlas RGBA 4×2, caisse, blindage, pylônes électriques, barrière haute, pics, drone, cible/interrupteur, laser. Illustrations réelles complétées par des arcs/pulsations animés Canvas.

Ces ressources ont été générées pour cette évolution, examinées visuellement et chargées dans Chromium. Les armes (arc, épée, bouclier), particules, éclairs et ondes sont des parties animées Canvas. Les limites de régularité du cycle de course et des poses intermédiaires sont documentées dans le README, sans revendiquer une production d’animation professionnelle.
