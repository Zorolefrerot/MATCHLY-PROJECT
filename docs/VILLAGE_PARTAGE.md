# Lot suivant — présence partagée et duel de test à Konoha

**Ajout au lot regroupé 0.11 :** deux joueurs admis peuvent lancer un duel réseau éphémère, avec quatre attaques texturées et une ultime clanique monumentale. Les dégâts, recharges, chakra, niveau de test, évitement de l’ultime et KO sont résolus par le serveur ; les comptes et la progression ne changent pas. [Détails des textures et ultimes](ULTIMES_ET_TEXTURES.md). Les anciens ZIP Android 6 et 9 sont maintenant supprimés (vérifié), la place nécessaire à la compilation est disponible.

**12 septembre 2026 : APK 0.11 compilée et artefact vérifié.** Le propriétaire confirme le fonctionnement de **0.10 sur son téléphone**. La suppression protégée, le téléchargement accepté et la musique fournie sont conservés, pas réimplémentés. L’exécution GitHub Actions **34719396621** a réussi l’import Godot, le WSS avec deux clients Godot, le rendu des ultimes, l’export/signature Android et les contrôles de permissions. L’essai physique sur deux téléphones reste à faire.

## Périmètre

- Deux comptes joueurs admis et déjà attribués peuvent se connecter séparément à la même salle, visibles avec leur nom de personnage au-dessus de la tête et leur apparence sauvegardée.
- Marche, course, saut et arrêt transmis ; affichage distant interpolé, sans collision entre joueurs.
- Départ, retour après arrière-plan/coupure et remplacement d’une connexion du même compte sans avatar doublonné.
- Texte de proximité **RP / HRP**, rayon **12 mètres**, sans canal global, équipe ou message privé dans ce premier lot.
- Aucune admission supplémentaire, récompense, progression, échange, modification de tirage, position persistante ou validation physique des missions. Le duel de test est la seule action de combat réseau ; mission personnelle, apparence cloud, entraînement solo et musique restent conservés.

Le rayon de 12 m est un paramètre initial du prototype, pas une nouvelle règle narrative imposée. Les murs n’atténuent pas le chat dans ce premier quartier extérieur. Les actions écrites n’ont aucun effet mécanique.

## Serveur et accès

`server/village.js` installe **WSS `/api/game/village` sur le même serveur et le même port que le site**, dans `server/index.js`. Dépendance `ws` **8.21.3**, version verrouillée et auditée. Pas de service payant supplémentaire, d’URL locale dans l’application ni de nouveau secret ; le workflow Android versionné compile la branche active.

- HTTPS requis en production derrière le proxy Render existant ; origine étrangère refusée lorsqu’un en-tête Origin est présent.
- Uniquement `Authorization: Bearer …` de la session native. Cookie du site/propriétaire, jeton en URL, candidat non admis, compte sans attribution et session expirée refusés.
- Authentification et installation du socket sous le même verrou transactionnel que connexion/suppression/réinitialisation : une ancienne authentification en attente ne peut réinstaller un jeton déjà révoqué après une nouvelle connexion.
- Réexamen groupé des sessions/admissions toutes les **2 s**, uniquement lorsqu’il y a des joueurs. Bail d’autorisation de **5 s**, non renouvelé à partir d’une réponse lente. Une panne de vérification ferme l’accès plutôt que prolonger indéfiniment une session. Aucun accès à Neon quand la salle est vide.
- Une connexion par compte. La nouvelle connexion valide remplace l’ancienne (4001) ; la fermeture tardive de l’ancien socket ne retire pas le nouveau. Le client remplacé ne se reconnecte pas en boucle.
- Les noms sont assainis et les apparences contrôlées côté serveur. Le roster de présence ne contient ni e-mail, mot de passe, jeton, clan, affinité, potentiel Mokuton ni mission personnelle. Pendant un duel, seuls le nom, le clan déjà attribué, le niveau de test et les jauges du duel sont transmis aux deux participants.
- Maximum vingt présences, dans la cohorte existante de vingt admissions. **Les essais de cette tranche portent sur deux joueurs, pas une charge réelle de vingt téléphones.**

La révocation d’un socket déjà ouvert est bornée par ce bail ; ce n’est pas la promesse d’effacer des paquets déjà reçus ou un APK installé. Les API HTTP continuent leur propre contrôle d’accès à chaque appel.

## Protocole éphémère 1

Serveur : `welcome` (compte courant, point d’arrivée, rayon), `roster` (identités/apparences), `snapshot` (positions et animations, dix fois par seconde), `correction`, `chat`, `chat_ack`, `combat_waiting`, `combat_started`, `combat_state`, `combat_action`, `combat_hit`, `combat_evaded`, `combat_result`, `combat_end`, `error`.

Client :

```json
{"type":"move","seq":0,"p":[0,0.25,22],"yaw":0,"motion":"idle"}
{"type":"chat","seq":0,"channel":"RP","text":"Bonjour !"}
{"type":"combat_join"}
{"type":"combat_level","level":10}
{"type":"combat_action","seq":0,"kind":"ultimate","direction":[1,0,0]}
{"type":"combat_leave"}
{"type":"respawn"}
```

- Formats exacts, nombres finis, séquences monotones, coordonnées et rotation bornées. Aucune identité, cible, statistique ou récompense fournie par le client.
- Limite grossière de déplacement horizontal : budget de 2 m, renouvelé à 8 m/s ; saut borné et retour au point d’arrivée limité. Une position trop éloignée provoque une correction, pas une écriture de progression.
- **La présence n’est pas une simulation physique autoritaire ni un anti-triche complet.** Le serveur ne calcule pas les collisions du décor ; un client modifié pourrait traverser des obstacles. Le duel reste toutefois serveur-authoritatif pour la cible, la portée, les dégâts, les coûts, les recharges, le niveau de test et le KO ; un paquet client ne peut pas fournir ses propres dégâts.
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
- Les anciens artefacts Android 6 et 9 ne sont pas nécessaires au nouveau téléchargement. L’artefact 0.11 `idrem-zenkai-android-25` a été généré par GitHub Actions ; l’APK est contrôlée, mais l’artefact temporaire reste soumis à l’expiration GitHub du 19 septembre 2026.

## Application

`VillageLink` utilise le WSS de l’origine HTTPS du compte, la vérification TLS normale et un jeton en RAM. Aucun mode TLS non sûr dans le code de production. La confiance dans un certificat local n’existe que dans la sous-classe de test, exclue de l’APK.

`VillageAvatar` reste visuel pour la présence et reçoit seulement l’état de PV du duel. La simulation de combat est dans `VillageRoom`, côté serveur ; les avatars n’ont pas de collision ni de dégâts locaux. Les identités présentes sont réconciliées et les avatars disparus retirés. Déconnexion → avatars et duel effacés, sans effacer les étapes déjà confirmées de la mission.

`VillageChat` utilise un panneau tactile, choix RP/HRP, fil défilant, saisie et accusé d’envoi. Chaque client se connecte avec sa propre session native : aucun joueur n’a besoin d’héberger ou de rester connecté pour que l’autre entre dans le village. Les noms locaux et distants sont affichés au-dessus des avatars. Il bloque les commandes du personnage, pas le réseau ou la musique. Sa hauteur tient compte du clavier virtuel ; **ergonomie et clavier Android encore à vérifier réellement**.

Perte de focus → fermeture ; retour → reconnexion. Coupure transitoire → tentatives espacées (1, 2, 4, 8, 16 s, puis arrêt après six échecs). Session retirée/compte ouvert ailleurs → retour nécessaire au compte, pas de lutte entre deux appareils. Une reconnexion réapparaît au point d’arrivée : aucune fausse sauvegarde de position.

## Validation effectuée / restante

### Effectuée localement

- **44 tests Node** : contrats HTTP précédents conservés, catalogue des 14 clans et leurs techniques, tests déterministes de salle, duel serveur (portée, cooldown, niveau et ultime) et **deux vrais clients WebSocket Node** contre le serveur. Admission, origine/HTTPS, apparences, saut, RP, départ, remplacement, révocation et suppression fictive.
- **10 tests PostgreSQL réel jetable**, dont le contrat réseau avec mutations depuis un deuxième pool.
- **2 parcours Playwright** et Vite réussis après `npm ci` : les fonctions du site et le téléchargement réservé aux admis sont conservés, avec les métadonnées 0.11.
- Le contrôle Godot 4.5.1 en CI réussit l’import, les assertions de gameplay, le scénario WSS Node ↔ deux clients Godot et le rendu GL des effets. Cela ne remplace pas un essai de fluidité ou de connexion sur deux téléphones.
- Audit npm : zéro vulnérabilité signalée au moment du contrôle.

### Restant après la compilation

- Installer l’APK 0.11 sur deux téléphones Android et vérifier l’ergonomie tactile, le clavier de chat, la reconnexion et le délai réel du WSS.
- Déployer le dernier commit sur le service Render existant : `render.yaml` cible maintenant la branche active, mais le service conserve son **Manual Deploy**.
- L’artefact GitHub reste un stockage temporaire ; un hébergement Android permanent ou une publication Play Store n’est pas encore en place.

```sh
npm ci
npm test
npm run test:postgres
npm run test:browser
# Godot 4.5.1 + OpenSSL + Node >=22.13 installés :
GODOT_BIN=/chemin/godot bash game/tools/check.sh
```

`server/android-build.js` pointe maintenant vers l’APK **0.11.0** vérifiée : ZIP `idrem-zenkai-android-25`, **68 909 306 octets**, expiration **19 septembre 2026 à 21:17:09 UTC**. Le bouton reste protégé par l’admission du compte ; il sera visible en production après le Manual Deploy Render.

## Livraison groupée et hébergement gratuit

Le nouvel artefact Android 0.11 est temporaire et reste soumis au quota/rétention GitHub. Ce n’est pas le relevé de facturation global GitHub. Deux anciens ZIP peuvent être retirés manuellement, en conservant la version active :

- [`idrem-zenkai-android-6`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34446543408) : 62 880 104 octets, artefact 10139893231.
- [`idrem-zenkai-android-9`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323) : 62 950 239 octets, artefact 10141009252.

Aucun de ces fichiers n’a été supprimé par l’agent, aucun budget ou paiement modifié. **Garder l’artefact Android 25** tant que le nouveau lien est utilisé par le site. Les artefacts 18 et 19 restent l’historique 0.10 ; ils ne sont plus la version annoncée. Pas d’APK intermédiaire.

Le lien vérifié du site est maintenant mis à jour vers l’artefact 0.11 ; il reste à effectuer le **Manual Deploy du dernier commit sur le service Render existant**, puis l’essai à deux. La salle existe en mémoire dans **un seul processus Render**. Un redémarrage/redéploiement déconnecte tout le monde ; chacun rejoint une salle vide au retour. Pas de coordination entre plusieurs instances. Render/Neon gratuits peuvent se mettre en veille ; aucune garantie 24 h/24 ou de disponibilité permanente. Le trafic de présence consomme aussi les quotas gratuits : vingt joueurs continus ne sont pas promis par ce prototype à deux.
