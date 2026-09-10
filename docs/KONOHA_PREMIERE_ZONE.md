# Konoha — première zone jouable, version 0.7

**APK compilée, tests moteur et captures vérifiés. Essai de cette nouvelle zone sur téléphone encore à faire.** Le propriétaire a confirmé le fonctionnement du compte 0.6, puis demandé une zone distincte du terrain d’entraînement.

## Accès

1. Dans l’APK **0.7**, ouvrir **MON COMPTE** et se connecter avec son compte joueur admis.
2. Appuyer sur **ENTRER À KONOHA · PREMIÈRE ZONE SOLO**. Le serveur est interrogé à nouveau pour vérifier la session/admission et récupérer la dernière apparence sauvegardée.

**Aucun nouveau déploiement Render requis** si le serveur 0.6 fonctionne déjà : même API `/api/game/profile`, même protocole, aucune nouvelle table ni variable privée. Si la session a expiré, reconnecter le compte. Le compte administrateur reste exclu de ce parcours joueur ; ses fonctions initiales de Hokage/chef de l’Akatsuki ne sont pas encore implémentées.

## Ce qui est jouable

- Quartier d’accueil d’environ 58 × 66 mètres, avec une porte au sud, une allée centrale et des rues transversales.
- Maisons aux toits colorés, étals du marché, extérieur de l’académie et résidence circulaire du Hokage au nord ; arbres, bancs et panneaux.
- Personnage portant **l’apparence enregistrée sur le compte**, avec son nom et son clan affichés. À défaut d’apparence distante, utilisation du modèle par défaut ; aucun import automatique du personnage d’entraînement.
- Marche, course, saut, joystick et caméra au doigt ; clavier ZQSD/WASD, Maj, Espace et **E** pour interagir. Pas de frappe/jutsu dans ce quartier pour le moment.
- **Aoi**, PNJ d’accueil original près de l’arrivée : s’approcher puis **PARLER À AOI**. Dialogue écrit, sans IA externe.
- Trois panneaux à lire : marché, académie, résidence du Hokage. Le repérage est compté pendant la visite ; Aoi réagit lorsque les trois lieux ont été consultés.
- Pause et dialogues arrêtent les déplacements. Perte de focus → pause ; bouton Retour Android → pause/reprise. **RETOUR À MON COMPTE** quitte la visite sans lancer l’entraînement.

## Limites explicites

- C’est une **visite solo**, pas encore un village partagé : aucun autre joueur, chat réseau ou synchronisation des positions.
- Bâtiments visibles de l’extérieur uniquement ; portes fermées, pas d’intérieurs, boutique, inventaire ou mission rémunérée.
- Le repérage n’accorde aucun objet, ryō, expérience, rang ou pouvoir. Position et repérage ne sont pas sauvegardés : une nouvelle visite repart de l’entrée.
- L’admission est vérifiée à l’entrée, pas surveillée en continu pendant cette simulation locale. Aucun appel réseau périodique pendant la marche ; nouvelle vérification à la prochaine entrée.
- Géométrie et personnages procéduraux provisoires, pas une reconstitution complète/définitive de Konoha. Pas de nouvelle musique ; les sons de combat fournis sont conservés dans l’entraînement.

## Isolation technique et performances

- Scène `game/scenes/konoha.tscn`, scripts `konoha_map.gd`, `konoha_visit.gd`, `konoha_hud.gd`.
- `SubViewport` et `World3D` propres à la visite. Le contrôleur tactile testé de l’entraînement est réutilisé, sans son interface de combat.
- Pendant la visite, le nœud d’entraînement est désactivé, ses entrées sont désactivées et le rendu 3D du viewport racine est coupé. Le monde Konoha continue seul ; pas de double rendu des deux cartes.
- La fermeture arrête le rendu du viewport de visite, détruit ses nœuds, restaure le traitement de l’entraînement et revient au compte en pause. Les règles, la position, les recharges et l’apparence locale de l’entraînement ne sont pas modifiées par l’exploration.
- Collisions des murs, bâtiments, arbres, bancs et étals ; portée et ligne de vue pour interagir. Retour au point d’arrivée si le personnage sort accidentellement des limites ou tombe sous le sol.
- Pas d’ombres dynamiques ni de MSAA dans cette première visite. Pas de mesure de FPS Android : le budget réduit ne remplace pas l’essai sur l’appareil réel.

## Vérifications

- **178 assertions Godot** passées, dont déplacement/saut/atterrissage, monde physique indépendant, nom et apparence du compte, multitouch isolé, murs, trois panneaux, dialogue, pause/focus/Retour, récupération de chute, retour au compte et refus d’entrée après expiration.
- **23 tests Node**, **7 tests PostgreSQL** et construction Vite réussis. Code serveur et schéma inchangés.
- Captures réelles de l’arrivée, du marché et du dialogue d’Aoi produites ; arrivée et dialogue inspectés dans Arena. Les captures utilisent un profil fictif de test, pas les identifiants d’un joueur réel.
- Exécution finale **34459811443**, source **4cc94435634f0dee3d3adda9a53143f21aca1319**, APK **0.7.0/code 7**. Téléchargement et empreintes : [`game/VALIDATION.md`](../game/VALIDATION.md).

## Stockage gratuit de compilation

La suppression de deux APK intermédiaires non livrées (artefacts des exécutions 7 et 8) a été tentée pour libérer du stockage, mais l’intégration GitHub l’a refusée avec **403**. **Aucune suppression par l’agent n’a abouti.** Les liens et noms précis ont été donnés au propriétaire pour le faire depuis GitHub ; son intervention n’est pas encore confirmée. Les versions livrées ne sont pas visées. Pas de modification des budgets ou du moyen de paiement ; rétention des artefacts toujours 7 jours.
