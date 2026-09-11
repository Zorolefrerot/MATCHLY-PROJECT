# Lot suivant — première présence partagée à Konoha

**Ajout au lot regroupé 0.11 :** attaques enrichies d’images/textures et laboratoire de quatorze ultimes monumentales avec niveau simulé, sans changer les comptes. [Détails et limites](ULTIMES_ET_TEXTURES.md). Les anciens ZIP Android 6 et 9 sont maintenant supprimés (vérifié), la place nécessaire à la compilation est disponible.

**11 septembre 2026 : sources 0.11 en validation, pas d’APK 0.11 livrée.** Le propriétaire confirme le fonctionnement de **0.10 sur son téléphone**, puis demande de poursuivre le lot réseau déjà convenu. La suppression protégée, le téléchargement accepté et la musique fournie sont conservés, pas réimplémentés.

## Périmètre

- Deux comptes joueurs admis et déjà attribués, visibles avec leur nom de personnage et leur apparence sauvegardée.
- Marche, course, saut et arrêt transmis ; affichage distant interpolé, sans collision entre joueurs.
- Départ, retour après arrière-plan/coupure et remplacement d’une connexion du même compte sans avatar doublonné.
- Texte de proximité **RP / HRP**, rayon **12 mètres**, sans canal global, équipe ou message privé dans ce premier lot.
- Aucune admission supplémentaire, récompense, action de combat réseau, échange, modification de tirage, position persistante ou validation physique des missions. Mission personnelle, apparence cloud, entraînement séparé et musique restent conservés.

Le rayon de 12 m est un paramètre initial du prototype, pas une nouvelle règle narrative imposée. Les murs n’atténuent pas le chat dans ce premier quartier extérieur. Les actions écrites n’ont aucun effet mécanique.

## Serveur et accès

`server/village.js` installe **WSS `/api/game/village` sur le même serveur et le même port que le site**, dans `server/index.js`. Dépendance `ws` **8.21.3**, version verrouillée et auditée. Pas de service payant supplémentaire, d’URL locale dans l’application, de changement de secrets ou de workflow GitHub.

- HTTPS requis en production derrière le proxy Render existant ; origine étrangère refusée lorsqu’un en-tête Origin est présent.
- Uniquement `Authorization: Bearer …` de la session native. Cookie du site/propriétaire, jeton en URL, candidat non admis, compte sans attribution et session expirée refusés.
- Authentification et installation du socket sous le même verrou transactionnel que connexion/suppression/réinitialisation : une ancienne authentification en attente ne peut réinstaller un jeton déjà révoqué après une nouvelle connexion.
- Réexamen groupé des sessions/admissions toutes les **2 s**, uniquement lorsqu’il y a des joueurs. Bail d’autorisation de **5 s**, non renouvelé à partir d’une réponse lente. Une panne de vérification ferme l’accès plutôt que prolonger indéfiniment une session. Aucun accès à Neon quand la salle est vide.
- Une connexion par compte. La nouvelle connexion valide remplace l’ancienne (4001) ; la fermeture tardive de l’ancien socket ne retire pas le nouveau. Le client remplacé ne se reconnecte pas en boucle.
- Les noms sont assainis et les apparences contrôlées côté serveur. Les autres clients ne reçoivent ni e-mail, mot de passe, jeton, clan, affinité, potentiel Mokuton ni mission personnelle.
- Maximum vingt présences, dans la cohorte existante de vingt admissions. **Les essais de cette tranche portent sur deux joueurs, pas une charge réelle de vingt téléphones.**

La révocation d’un socket déjà ouvert est bornée par ce bail ; ce n’est pas la promesse d’effacer des paquets déjà reçus ou un APK installé. Les API HTTP continuent leur propre contrôle d’accès à chaque appel.

## Protocole éphémère 1

Serveur : `welcome` (compte courant, point d’arrivée, rayon), `roster` (identités/apparences), `snapshot` (positions et animations, dix fois par seconde), `correction`, `chat`, `chat_ack`, `error`.

Client :

```json
{"type":"move","seq":0,"p":[0,0.25,22],"yaw":0,"motion":"idle"}
{"type":"chat","seq":0,"channel":"RP","text":"Bonjour !"}
{"type":"respawn"}
```

- Formats exacts, nombres finis, séquences monotones, coordonnées et rotation bornées. Aucune identité, cible, statistique ou récompense fournie par le client.
- Limite grossière de déplacement horizontal : budget de 2 m, renouvelé à 8 m/s ; saut borné et retour au point d’arrivée limité. Une position trop éloignée provoque une correction, pas une écriture de progression.
- **Ce n’est pas une simulation physique autoritaire ni un anti-triche complet.** Le serveur ne calcule pas les collisions du décor ; un client modifié pourrait traverser des obstacles et influencer sa proximité. Pas de combat, récompense ou échange qui s’appuie sur ces coordonnées dans ce lot.
- Trames entrantes de 1 Kio maximum, compression désactivée, files/fragmentation bornées, budget de messages et fermeture des connexions trop lentes. Quatre authentifications simultanées maximum ; limite de tentatives bornée, partagée lorsque les connexions proviennent du même proxy.
- Deux secondes sans déplacement reçu → animation au repos ; quinze secondes sans message → retrait de la présence. Un départ explicite ou une mise en arrière-plan ferme le socket sans attendre cette échéance.

## Chat et confidentialité

**240 unités UTF-16 maximum**, même borne côté Node et Godot, y compris les emoji. Contrôles, retours à la ligne et formatages invisibles refusés. Affichage en texte littéral : BBCode désactivé, pas de HTML ou liens exécutables.

Trois messages en rafale, puis recharge d’un message toutes les deux secondes. La portée est calculée sur les dernières coordonnées acceptées. Le serveur fournit le nom et l’identité de l’émetteur. Une séquence déjà traitée est acquittée sans rediffuser le texte.

Le client vide la saisie **après acquittement**. En cas de coupure ou délai, il conserve le brouillon et signale que l’envoi n’est pas confirmé : aucun renvoi automatique. Un message a pu être reçu malgré la perte de son acquittement.

- Serveur : aucun historique en base, aucun journal de contenu, aucun rattrapage après connexion.
- Client : au plus **50 messages reçus dans la RAM** de cette visite, détruits à la sortie. Pas de stockage sur disque. Les messages déjà vus restent consultables pendant la même visite, même après s’être éloigné.
- Pas encore d’interface de signalement, de modération de chat ou de bannissement temporaire dédiée. L’administrateur conserve la suppression de compte protégée existante ; aucune suppression automatique pour inactivité ou propos.

## Durcissement des connexions avant compilation

- Les demandes WebSocket sur un chemin inconnu reçoivent 404 et sont fermées, plutôt que laisser des sockets ouverts sans gestionnaire. Le routage HMR éventuel reste délégué à un autre écouteur uniquement en développement.
- Les en-têtes de session absents ou malformés sont refusés avant toute acquisition de connexion/verrou de base. Test avec un adaptateur interdisant tout accès DB.
- Une salle momentanément pleine ou un bail non renouvelé utilise le code transitoire **1013**, même si un paquet arrive avant le prochain tick. Le client peut réessayer sans effacer une connexion de compte encore valable. Une véritable expiration reste **4003** ; les révocations vérifiées le restent également.
- Contrats SQLite et PostgreSQL relancés : chemin inconnu, capacité puis départ, reprise, expiration et suppression restent couverts.
- Les anciens artefacts Android 6 et 9 sont **toujours présents** lors du nouveau contrôle GitHub (total inchangé : 517 240 603 octets). Aucun effacement ou lancement de compilation effectué. L’essai d’accès à un miroir du binaire Godot a également échoué ; aucune validation native supplémentaire n’est prétendue.

## Application

`VillageLink` utilise le WSS de l’origine HTTPS du compte, la vérification TLS normale et un jeton en RAM. Aucun mode TLS non sûr dans le code de production. La confiance dans un certificat local n’existe que dans la sous-classe de test, exclue de l’APK.

`VillageAvatar` est uniquement visuel : nom, apparence, interpolation et animation ; aucune simulation de combat ni collision. Les identités présentes sont réconciliées et les avatars disparus retirés. Déconnexion → avatars effacés et chat désactivé, sans effacer les étapes déjà confirmées de la mission.

`VillageChat` utilise un panneau tactile, choix RP/HRP, fil défilant, saisie et accusé d’envoi. Il bloque les commandes du personnage, pas le réseau ou la musique. Sa hauteur tient compte du clavier virtuel ; **ergonomie et clavier Android encore à vérifier réellement**.

Perte de focus → fermeture ; retour → reconnexion. Coupure transitoire → tentatives espacées (1, 2, 4, 8, 16 s, puis arrêt après six échecs). Session retirée/compte ouvert ailleurs → retour nécessaire au compte, pas de lutte entre deux appareils. Une reconnexion réapparaît au point d’arrivée : aucune fausse sauvegarde de position.

## Validation effectuée / restante

### Effectuée localement

- **41 tests Node** : contrats HTTP précédents conservés, tests déterministes de salle et **deux vrais clients WebSocket Node** contre le serveur. Admission, origine/HTTPS, apparences, saut, RP, départ, remplacement, révocation et suppression fictive.
- **10 tests PostgreSQL réel jetable**, dont le contrat réseau avec mutations depuis un deuxième pool.
- **2 parcours Playwright** et Vite réussis après `npm ci` : les fonctions du site et le téléchargement 0.10 sont conservés.
- Analyse statique GDScript sans nouvelle erreur ; seul le faux positif historique de géométrie `PackedVector3Array` reste inchangé. Ce n’est pas une exécution du moteur.
- Audit npm : zéro vulnérabilité signalée au moment du contrôle.

### Préparée mais NON exécutée à ce stade

- Vérifications supplémentaires de protocole dans `game/tests/smoke.gd`.
- **Vrai test WSS entre Node et deux visites Godot** : `game/tests/run-network.mjs` et `village_network.gd`. Base SQLite, profils et certificat local jetables ; ne lit jamais la base de production. Exercices de noms/apparences, marche/course/saut, chat RP/HRP proche/loin, focus, reconnexion et remplacement.
- Ce test est raccordé à `game/tools/check.sh`, **avant tout export Android**. Une erreur ou l’absence du marqueur de succès bloque l’APK. Le workflow GitHub lui-même n’est pas modifié.
- Captures supplémentaires préparées : autre avatar et chat, avec profils explicitement fictifs. Pas encore rendues ni inspectées.
- Import/exécution Godot 4.5.1, export/signature 0.11, écoute et essai avec deux téléphones à faire.

```sh
npm ci
npm test
npm run test:postgres
npm run test:browser
# Godot 4.5.1 + OpenSSL + Node >=22.13 installés :
GODOT_BIN=/chemin/godot bash game/tools/check.sh
```

**Ne pas annoncer l’APK 0.11 avant ces contrôles.** `server/android-build.js` reste sur **0.10**, déjà compilée et confirmée par le propriétaire.

## Livraison groupée et hébergement gratuit

Avant la prochaine compilation : les artefacts non expirés du dépôt totalisent **517 240 603 octets (environ 493,3 Mio)**. Ce n’est pas le relevé de facturation global GitHub. Deux anciens ZIP peuvent être retirés manuellement, en conservant les versions récentes :

- [`idrem-zenkai-android-6`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34446543408) : 62 880 104 octets, artefact 10139893231.
- [`idrem-zenkai-android-9`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323) : 62 950 239 octets, artefact 10141009252.

Aucun de ces fichiers n’a été supprimé par l’agent, aucun budget ou paiement modifié. **Garder Android 18 et 19**, en particulier le lien 0.10 actuellement utilisé par le site. Pas d’APK intermédiaire.

Après validation et compilation du lot entier : mettre à jour le lien vérifié du site, puis **Manual Deploy du dernier commit sur le service Render existant**, puis essai à deux. La salle existe en mémoire dans **un seul processus Render**. Un redémarrage/redéploiement déconnecte tout le monde ; chacun rejoint une salle vide au retour. Pas de coordination entre plusieurs instances. Render/Neon gratuits peuvent se mettre en veille ; aucune garantie 24 h/24 ou de disponibilité permanente. Le trafic de présence consomme aussi les quotas gratuits : vingt joueurs continus ne sont pas promis par ce prototype à deux.
