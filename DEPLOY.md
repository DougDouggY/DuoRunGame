# Mise en ligne GitHub Pages

Le jeu est statique : aucun build, secret, backend ou API nécessaire au navigateur.

La branche `gh-pages` contient la version publiable à la racine, avec `.nojekyll`.

Si Pages n'est pas encore activé :

1. Ouvrir https://github.com/DougDouggY/DuoRunGame/settings/pages
2. Dans Build and deployment, choisir **Deploy from a branch**.
3. Choisir **gh-pages** et **/ (root)**, puis **Save**.
4. Attendre la fin de la publication GitHub Pages.

Adresse attendue, à vérifier après activation : https://dougdouggy.github.io/DuoRunGame/

Ne pas annoncer cette URL comme opérationnelle avant une réponse HTTP 200 et un test navigateur du jeu distant.

Au moment de la préparation, les requêtes HTTPS vers `api.github.com` étaient refusées par le proxy réseau avant authentification (CONNECT 403). L'accès Git HTTPS et l'envoi de la branche ont été vérifiés séparément. Ce refus ne prouve pas l'absence de droits sur le dépôt. Les domaines `api.github.com` et `dougdouggy.github.io` ont été ajoutés au brouillon de configuration ; l'enregistrement du brouillon ne modifie pas à lui seul le réseau de l'instance.
