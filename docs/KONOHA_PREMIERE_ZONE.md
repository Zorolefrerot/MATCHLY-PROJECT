# Konoha — quartier solo et rendu amélioré, version 0.8

**APK 0.8 compilée, tests moteur et captures vérifiés.** Le propriétaire a confirmé le fonctionnement du compte 0.6 puis approuvé la zone solo 0.7, avant de demander un rendu moins cubique. **Le nouvel aspect 0.8 n’a pas encore été essayé sur son téléphone.**

## Accès

1. Dans l’APK **0.8**, ouvrir **MON COMPTE** et se connecter avec son compte joueur admis.
2. Appuyer sur **ENTRER À KONOHA · PREMIÈRE ZONE SOLO**. Le serveur est interrogé à nouveau pour vérifier la session/admission et récupérer la dernière apparence sauvegardée.

**Aucun nouveau déploiement Render requis** si le serveur 0.6 fonctionne déjà : même API `/api/game/profile`, même protocole, aucune nouvelle table ni variable privée. Si la session a expiré, reconnecter le compte. Le compte administrateur reste exclu de ce parcours joueur ; ses fonctions initiales de Hokage/chef de l’Akatsuki ne sont pas encore implémentées.

## Ce qui est jouable

- Quartier d’accueil d’environ 58 × 66 mètres, avec une porte au sud, une allée centrale et des rues transversales.
- Maisons à étages arrondis et toits courbes, étals du marché, extérieur de l’académie, résidence rouge et or au nord ; arbres, bancs et panneaux. Monument à quatre visages en décor texturé derrière des volumes de rochers.
- Personnage portant **l’apparence enregistrée sur le compte**, avec son nom et son clan affichés. À défaut d’apparence distante, utilisation du modèle par défaut ; aucun import automatique du personnage d’entraînement.
- Marche, course, saut, joystick et caméra au doigt ; clavier ZQSD/WASD, Maj, Espace et **E** pour interagir. Pas de frappe/jutsu dans ce quartier pour le moment.
- **Aoi**, PNJ d’accueil original près de l’arrivée : s’approcher puis **PARLER À AOI**. Dialogue écrit, sans IA externe.
- Trois panneaux à lire : marché, académie, résidence du Hokage. Le repérage est compté pendant la visite ; Aoi réagit lorsque les trois lieux ont été consultés.
- Pause et dialogues arrêtent les déplacements. Perte de focus → pause ; bouton Retour Android → pause/reprise. **RETOUR À MON COMPTE** quitte la visite sans lancer l’entraînement.

## Remaniement visuel 0.8

Les trois images fournies guident les formes, couleurs et détails. Les anciens cubes des maisons sont remplacés par des volumes elliptiques à étages en retrait ; les colliders suivent les nouveaux murs. La résidence reçoit un corps rouge, des ailes basses, des toits dorés et un porche. Sept textures de 256² ou 512² sont partagées ; toutes les fenêtres, portes et l’emblème sont regroupés dans un seul maillage.

Le monument utilise les **quatre premiers visages** pour correspondre à l’image de la résidence. Ce choix n’impose pas une nouvelle époque au scénario ; l’image complète à sept visages reste dans le dépôt. Les visages sont une **image texturée fixe**, pas des sculptures 3D. Les sources petites limitent leur définition. [Préparation, provenance et droits non vérifiés](../game/assets/konoha/README.md).

![Arrivée — capture ordinateur réelle réduite, pas un essai Android](images/konoha-08-arrival.jpg)
![Maisons et marché — capture ordinateur réelle réduite](images/konoha-08-market.jpg)

## Limites explicites

- C’est une **visite solo**, pas encore un village partagé : aucun autre joueur, chat réseau ou synchronisation des positions.
- Bâtiments visibles de l’extérieur uniquement ; portes fermées, pas d’intérieurs, boutique, inventaire ou mission rémunérée.
- Le repérage n’accorde aucun objet, ryō, expérience, rang ou pouvoir. Position et repérage ne sont pas sauvegardés : une nouvelle visite repart de l’entrée.
- L’admission est vérifiée à l’entrée, pas surveillée en continu pendant cette simulation locale. Aucun appel réseau périodique pendant la marche ; nouvelle vérification à la prochaine entrée.
- Géométrie et personnages procéduraux provisoires, pas une reconstitution complète/définitive de Konoha. Pas de nouvelle musique ; les sons de combat fournis sont conservés dans l’entraînement.

## Isolation technique et performances

- Scène `game/scenes/konoha.tscn`, scripts `konoha_map.gd`, `konoha_architecture.gd`, `konoha_visit.gd`, `konoha_hud.gd`.
- `SubViewport` et `World3D` propres à la visite. Le contrôleur tactile testé de l’entraînement est réutilisé, sans son interface de combat.
- Pendant la visite, le nœud d’entraînement est désactivé, ses entrées sont désactivées et le rendu 3D du viewport racine est coupé. Le monde Konoha continue seul ; pas de double rendu des deux cartes.
- La fermeture arrête le rendu du viewport de visite, détruit ses nœuds, restaure le traitement de l’entraînement et revient au compte en pause. Les règles, la position, les recharges et l’apparence locale de l’entraînement ne sont pas modifiées par l’exploration.
- Collisions des murs, bâtiments, arbres, bancs et étals ; portée et ligne de vue pour interagir. Retour au point d’arrivée si le personnage sort accidentellement des limites ou tombe sous le sol.
- Pas d’ombres dynamiques ni de MSAA dans cette première visite. Pas de mesure de FPS Android : le budget réduit ne remplace pas l’essai sur l’appareil réel.

## Vérifications

- **186 assertions Godot** passées : régressions 0.7 plus géométrie courbe bornée, UV/normales finies, matériaux, détails regroupés, proportions du monument, collisions et angles de l’ancienne emprise carrée libérés.
- **25 tests Node**, **7 tests PostgreSQL** et construction Vite réussis. Code serveur, schéma, combat et sons inchangés.
- Quinze captures ordinateur produites, dont cinq vues du village. **Arrivée et marché inspectés** dans Arena avec bâtiments et monument visibles. Maison rapprochée, résidence rapprochée et dialogue produits dans le ZIP, mais non inspectés séparément ici : les annotations GitHub ont plafonné à dix notices pour cette étape et le téléchargement du journal redirigé a échoué. Aucun second APK lancé uniquement pour récupérer ces vues.
- Captures avec profil fictif de test, pas un compte réel. Exécution finale **34471313696**, source **3c0d6ab13995e9972d2b3e79942781ec83b22657**, APK **0.8.0/code 8**. Téléchargement et empreintes : [`game/VALIDATION.md`](../game/VALIDATION.md).

## Stockage gratuit de compilation

La suppression de deux APK intermédiaires non livrées (artefacts des exécutions 7 et 8) a été tentée pour libérer du stockage, mais l’intégration GitHub l’a refusée avec **403**. **Aucune suppression par l’agent n’a abouti.** Les deux anciens artefacts ne figurent plus dans la liste consultée après l’apport des images ; leur suppression n’est pas attribuée à l’agent. Les versions livrées n’étaient pas visées. Le stockage restant approche le quota gratuit après cet APK : avant une prochaine compilation, revoir les anciens artefacts ou attendre leur expiration plutôt que multiplier les APK intermédiaires. Pas de modification des budgets ou du moyen de paiement ; rétention des artefacts toujours 7 jours.
