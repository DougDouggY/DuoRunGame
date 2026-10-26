# DUO RUSH — budget réseau et option Cloudflare

Le réseau actuel est WebRTC pair à pair, simulation sur l’ordinateur hôte. `PeerSession.tick()` plafonne les snapshots à 20/s ; l’invité envoie seulement ses actions. Il n’existe pas encore de backend Cloudflare dans le dépôt. Mettre les fichiers statiques sur Cloudflare Pages ne transforme pas ces paquets directs en messages Workers.

## Comparaison avec un jeu au tour par tour

Pour Les Gourmands, une action de joueur peut correspondre à une requête HTTP ; le serveur renvoie ensuite le résultat du tour. Dans DUO RUSH, il faut maintenir les deux parties synchronisées plus souvent, mais **une image affichée n’est pas une requête réseau**. Un appui peut devenir un petit message « saut à telle heure », puis chaque navigateur calcule les images de l’animation. Des corrections périodiques gardent les deux vues cohérentes.

Un **WebSocket** est une connexion ouverte qui transporte ensuite de nombreux petits messages. C’est un mode de communication différent d’une nouvelle requête HTTP à chaque action ou image. Les 100 000 requêtes Workers/jour ne correspondent donc pas automatiquement à 100 000 messages de jeu.

Exemple prudent pour **une salle de deux joueurs pendant deux heures** :

| Élément | Estimation avec relais DO |
| --- | ---: |
| États envoyés par l’hôte à 20/s | 144 000 messages entrants |
| Actions invité supposées à 2/s en moyenne | 14 400 messages entrants |
| Total entrant | 158 400 messages |
| Équivalent de facturation à 20 messages pour 1 requête | 7 920 requêtes, plus connexions/autres appels |
| Durée si le DO reste actif pendant les deux heures | environ 900 GB-s |

À comparer aux allocations documentées de 100 000 requêtes et 13 000 GB-s par jour pour les DO Free. Ce calcul permet de dimensionner un usage privé ; il ne remplace pas la vérification du quota effectif et des autres usages sur le futur déploiement. Les autres jeux du compte peuvent aussi consommer les allocations partagées. Aucune écriture en base à chaque image n’est nécessaire dans l’architecture envisagée.

Le flux d’état actuel représente environ 195 Mo/h de données avant entêtes/compression : **environ 390 Mo pour deux heures** d’envoi de l’hôte et de réception de l’invité, auxquels s’ajoutent les petits messages de contrôle. Il ne s’agit ni de vidéo, ni d’un transfert de la musique. Le format d’état peut encore être allégé. En WebRTC direct, Cloudflare ne reçoit pas ce flux ; prévoir toutefois une solution de relais pour les réseaux où le pair à pair échoue.

Hypothèses d’une salle privée de deux personnes, sans stockage par frame, reconnexions ni autres utilisateurs :

| Architecture | Messages de jeu entrants dans le relais / heure | Requêtes de calcul DO équivalentes selon ratio 20:1 |
| --- | ---: | ---: |
| WebRTC direct actuel, Cloudflare sert seulement le site | 0 | 0 pour le jeu ; chargements du site/signalisation éventuelle séparés |
| Relais WebSocket : hôte 20/s, invité en moyenne 2 actions/s | 79 200 | environ 3 960, plus connexions et autres appels |
| Relais : deux clients envoyant chacun 20/s | 144 000 | environ 7 200, plus connexions et autres appels |

Le plafond de l’hôte seul est 72 000 messages/h. Ce ne sont pas 72 000 requêtes HTTP/h. Un relais utilisant une requête HTTP par paquet aurait effectivement un coût de requêtes beaucoup plus élevé. Les nombres de la table sont des estimations de facturation suivant la documentation, pas un test de quota ni une garantie de gratuité d’un futur déploiement.

La documentation officielle distingue :

- **Workers Free** : 100 000 requêtes/jour. L’Upgrade WebSocket compte comme requête ; les messages WebSocket traversant un Worker ne comptent pas comme nouvelles requêtes Workers.
- **Durable Objects Free** : 100 000 requêtes/jour et 13 000 GB-s/jour. Le calcul de facturation applique 20 messages WebSocket entrants pour 1 requête. Les messages sortants ne sont pas facturés en requêtes ; les statistiques de messages continuent d’afficher les nombres réels.
- Un DO restant actif utilise une allocation facturée de 128 Mo : une heure active représente environ **450 GB-s** (0,125 × 3 600). L’API WebSocket Hibernation peut éviter de compter les périodes réellement inactives ; ce n’est pas une raison de garantir qu’une simulation serveur avec timers hibernera.

Un petit relais privé paraît donc compatible avec un usage modeste du gratuit, sous réserve des autres usages, limites de CPU/durée et de la configuration. Le choix recommandé à évaluer est soit un petit service de création de salle gardant le jeu en WebRTC direct, soit un DO WebSocket avec hibernation relayant les paquets de l’hôte sans recalculer ni enregistrer chaque frame. Aucune de ces options n’est présentée comme déjà déployée.

Mesure locale sur le catalogue V4.4 à vitesse Rapide avec deux IA : les snapshots JSON échantillonnés représentent environ **2,7 Ko en moyenne**, maximum observé environ **4,2 Ko**, avant compression/entêtes réseau. À 20/s constants, 2,7 Ko représente de l’ordre de **195 Mo/h** de données d’état sortant de l’hôte. Cette mesure du catalogue n’est pas une borne sur tous les futurs niveaux.

Musique : chaque fichier est une URL blob locale, sans upload ni transfert à l’autre joueur. Les notes personnelles et leur analyse ne créent aucun trafic réseau. Les bruitages partagés sont des noms d’événements ajoutés aux snapshots déjà envoyés.

Sources officielles consultées le 26 octobre 2026, via le dépôt public de documentation Cloudflare (pages Web directes indisponibles depuis l’environnement) :

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — [source](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/pricing.mdx)
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) — [table et ratio WebSocket](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/durable-objects-pricing.mdx)

Les offres peuvent changer ; recontrôler ces tarifs lors de la mise en place du relais.
