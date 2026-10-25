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
