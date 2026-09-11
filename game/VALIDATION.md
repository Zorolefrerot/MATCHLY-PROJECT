# Validation du prototype — 11 septembre 2026

## Lot suivant 0.11 — sources en validation, aucun nouvel APK

Le propriétaire confirme que **0.10 fonctionne sur son téléphone**, puis autorise la suite. Présence, mouvements, reconnexion et chat de proximité raccordés côté serveur et Godot. **37 tests Node, 10 tests PostgreSQL, 2 parcours Playwright et Vite** réussis localement après installation verrouillée. Analyse GDScript sans nouvelle erreur, faux positif historique de géométrie inchangé.

**Les nouveaux tests moteur, le scénario WSS Node ↔ deux visites Godot, les captures 0.11 et l’export Android ne sont pas encore exécutés.** Ils précèdent la prochaine APK regroupée. Libérer d’abord de la place parmi les anciens artefacts GitHub ; aucun budget, fichier de workflow ou compte réel modifié. [Contrat et plan de validation](../docs/VILLAGE_PARTAGE.md).

Les preuves ci-dessous concernent les APK déjà compilées, pas une validation moteur anticipée du code 0.11.

## Résultats actuels du lot regroupé 0.10

| Vérification | Résultat réel |
|---|---|
| Tests Node du site et des ressources du prototype | **31/31 passent** |
| Intégration PostgreSQL réel jetable | **9/9 passent**, dont suppression/remplacement et concurrence sur deux pools |
| Parcours Playwright Chromium | **2/2 passent**, dont téléchargement accepté et suppression fictive sur mobile |
| Construction Vite du site | Réussie, 1 597 modules |
| Import dans l’éditeur officiel complet | Réussi dans Godot 4.5.1, contrôle strict passé |
| Exécution de `tests/smoke.gd` | **238 assertions passent**, sortie 0, `IDREM_SMOKE_FAILURES=0` |
| Journal de simulation | Aucune `SCRIPT ERROR`, `ERROR` ou assertion échouée |
| Rendu GL / captures | Étape CI réussie sous Xvfb/Mesa ; arrivée avec musique et journal inspectés |
| Musique | Vorbis décodé, boucle et cycle de vie testés avec pilote Dummy ; pas une écoute humaine |
| Export APK / signature / permissions finales | Réussis : `apksigner`, INTERNET requis ; sans caméra/micro/contacts/localisation/stockage externe |
| Téléphone Android physique | **0.9 confirmé par le propriétaire**, mission et reprise comprises ; **0.10 également confirmée par le propriétaire** |
| GitHub Actions | Exécution **34601493231 verte** |
| Production Render | **Mise à jour 0.10 non effectuée par l’agent**, Manual Deploy nécessaire |

Les contrôles utilisent des bases jetables et des profils fictifs. Aucun compte réel supprimé. Pas d’essai HTTPS de production ni de benchmark Android. Présence multijoueur, déplacements synchronisés et chat RP/HRP restent à implémenter.

## Mise à jour 0.10.0 — administration, téléchargement et musique

[Exécution n° 19](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34601493231), source **`33fb9ac7d8aa152373be0fa7dca2711749132456`**, branche `arena/01a08158-matchly-project`. Job **103269627552**, du 11 septembre 2026 à **12:55:55 à 12:57:39 UTC**. Un seul APK pour les trois ajouts ; les métadonnées et documents de livraison sont actualisés ensuite sans deuxième build.

- **238 assertions Godot** : les 231 précédentes conservées plus sept vérifications musicales (Vorbis en boucle, volume/bus, lecture et isolation du combat, coupure, focus, arrêt à la sortie). Import, simulation, export, signature, permissions et captures réussis.
- **31 tests Node, 9 tests PostgreSQL, 2 parcours Playwright et Vite** réussis. Suites locales relancées après mise à jour du lien 0.10. Les tests navigateur couvrent l’admission et le téléchargement, les confirmations de suppression, l’erreur de mot de passe et son effacement, une suppression fictive et la révocation de session.
- Source musicale conservée, conversion reproductible : Vorbis **458 803 octets**, SHA-256 `0bef4d8e11e2f5ad0d88424726618ed5495f293e8edbdbf4e0f5b3dfd1246c58`. Décodage final : **78,132653 s**, pic **0,5848323**, RMS **0,0810419**, écart de boucle **0,00007638**. Mesures numériques, pas une écoute sur téléphone.
- Captures ordinateur récupérées intégralement via Checks et inspectées : [arrivée et bouton musical](../docs/images/konoha-10-arrival.jpg), [journal](../docs/images/konoha-10-journal.jpg). Les autres vues du ZIP ne sont pas prétendues inspectées. [Téléchargement 0.10 mobile](../docs/images/download-accepted-mobile.png) également inspecté.
- Version **0.10.0**, code **10**, HUD **PROTO 0.10**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7. Signature debug ; une réinstallation peut être nécessaire, avec perte des préférences locales mais pas des sauvegardes du compte conservé.
- APK `idrem-zenkai-training-debug.apk` : **63 798 925 octets**, SHA-256 **`c801372744afaa9f54efa958de56583741f67dcc96461a54a84c7ccb0c87b9bd`**.
- [ZIP `idrem-zenkai-android-19`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34601493231/artifacts/10264293080) : **67 529 246 octets**, expiration **18 septembre 2026 à 12:57:34 UTC** ; SHA-256 GitHub **`9be7bee733317479ee6dce0d6c4805ad5a69f597a211b657737429899e194dec`**. Connexion GitHub nécessaire ; pas un hébergement permanent ni un DRM.
- Journaux `godot-test-logs-19` : artefact **10264437975**, **24 295 octets**, pas l’installateur.
- API GitHub après livraison : **27 artefacts non expirés**, total **517 240 603 octets** (environ **493,3 Mio**), contre 449 687 062 avant ce build. Proche du quota gratuit ; ce sous-total du dépôt n’est pas le relevé global de facturation. Aucun artefact supprimé, budget changé ou workflow modifié par l’agent.
- Serveur : migrations additives, suppression acceptée avec nom exact/mot de passe/accord explicite de libération de place, révocation des accès, anonymisation et audit conservés ; vingt places et exactement trois potentiels préservés lors des remplacements. Téléchargement recontrôlé au clic. Aucun nouveau secret requis.
- **Déployer le dernier commit sur le service Render existant avant l’essai du site**. Fonctionnement de 0.10 ensuite confirmé par le propriétaire, sans vérification indépendante sur appareil par l’agent. [Contrats et limites](../docs/AJOUTS_SITE_MUSIQUE.md).

## Historique : mise à jour 0.9.0 — mission d’accueil, journal et sauvegarde

[Exécution n° 18](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34474189586), source **`fc8beb91a2fd9d9a9d085575ad614bf05dd4e41f`**, branche `arena/01a08158-matchly-project`. Lot implémenté en `334d81d85714bc505d09019c06dd87da18e75370`, puis durcissement des types JSON. Job **102860911832**, toutes les étapes réussies en **1 min 40 s**, du 10 septembre 2026 à 11:59:19 à 12:00:59 UTC.

- **231 assertions Godot** : 186 précédentes conservées, plus 45 vérifications de modèle/profil borné, journal, acceptation explicite, lecture avant acceptation refusée, accusés serveur, trois panneaux, panne ambiguë, relecture, doublons locaux, retour auprès d’Aoi, nouvelle visite, conflit, rapport terminé, absence de récompense, réponse tardive après fermeture et expiration sûre. Monde, avatar, caméra/joystick, collisions, retours, règles et apparence hors ligne restent isolés.
- **28 tests Node**, **8 tests PostgreSQL réel jetable** et Vite (1 597 modules) réussis localement. Le contrat HTTP mission est exercé sur SQLite et deux pools PostgreSQL. Tests d’identité/admission/session/cookie, révisions indépendantes, six ordres de lecture, doublons, concurrence, reprise après redémarrage/reconnexion, aucun changement des attributions ou de l’apparence.
- L’exécution n° 17 (**34474022876**) a relevé une erreur GDScript `String` contre `int` lors d’un test de données malformées, malgré zéro assertion échouée. Le contrôle strict du journal a correctement refusé l’étape, **avant tout export ou publication d’APK**. Types de version/identifiant/état/rang maintenant contrôlés avant comparaison, tests étendus ; exécution n° 18 sans erreur.
- Import officiel, simulation, export Android debug signé, permissions et captures réussis. **Un seul APK du lot publié** après le contrôle préalable ; aucun téléchargement intermédiaire demandé au propriétaire.
- Dix-huit captures ordinateur produites. **Journal et incident réseau inspectés**, images 480×270 récupérées intégralement via huit notices Checks. Texte défilant contenu dans le panneau, boutons visibles. Les autres captures sont dans le ZIP, pas prétendues inspectées individuellement ici. Captures avec profils fictifs, y compris l’incident ; pas de véritable coupure de réseau Android.
- Serveur modifié uniquement pour l’orientation : table additive `welcome_missions`, champ `welcomeMission` et route de cinq événements bornés. Les sessions et contrôles d’admission existants protègent chaque écriture ; pas de position, outbox local ou récompense. Un client modifié peut déclarer ses lectures : ce n’est pas une validation anti-triche de déplacement.
- Lors de la livraison 0.9 : **déploiement Render nécessaire avant l’essai**, service et branche existants, migration automatique sans nouveau secret. Le propriétaire a ensuite confirmé le fonctionnement de la mission et de sa reprise. `autoDeploy: false` conservé. Ni Neon de production ni les comptes réels n’ont été modifiés par les tests.
- Version **0.9.0**, code **9**, HUD **PROTO 0.9**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7. INTERNET conservé, aucune nouvelle permission sensible ; signature debug vérifiée.
- APK : **63 344 041 octets**, SHA-256 `b16b1952cddf81f27a37bd233ec8db2f69679680a7cd0eb8b82d1a5691b50505`.
- [ZIP `idrem-zenkai-android-18`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34474189586/artifacts/10150821501) : **67 075 079 octets**, expiration **17 septembre 2026 à 12:00:52 UTC** ; SHA-256 GitHub `f46bc83811fb5db5f0f706e94456f5de4f26cfec4c89681a6e44a77e1d53c4e3`.
- Journaux : `godot-test-logs-18`, artefact **10150819532**, **21 059 octets**, pas l’installateur.
- Stockage : le propriétaire a confirmé la suppression d’Android 4 (**10137929188**) et 5 (**10138409957**), vérifiée via l’API ; liste du dépôt passée de **503 402 822** à **382 584 984 octets** avant build, puis **449 687 062 octets** après les journaux et l’unique APK réussi. Ce n’est pas le relevé global de facturation. L’agent n’a supprimé aucun artefact et n’a modifié aucun budget, paiement ou workflow.
- Parcours, API et limites : [`docs/MISSION_ACCUEIL.md`](../docs/MISSION_ACCUEIL.md). Images réellement inspectées : [`journal`](../docs/images/konoha-09-journal.jpg), [`incident réseau`](../docs/images/konoha-09-network-error.jpg).

## Historique : mise à jour 0.8.0 — volumes arrondis et références du propriétaire

[Exécution n° 16](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34471313696), source **`3c0d6ab13995e9972d2b3e79942781ec83b22657`**, branche `arena/01a08158-matchly-project`. Job **102851609557**, toutes les étapes réussies en **1 min 36 s** ; exécution démarrée à 11:26:37 UTC.

- **186 assertions Godot** : 178 précédentes conservées plus quatre maisons/palais, surfaces courbes, budget de sommets et UV/normales finies, détails regroupés, proportions/emplacement de la falaise, sept matières texturées, collision des murs arrondis et ancien angle carré réellement libre. Les accès aux trois panneaux, le dialogue borné et l’isolation du compte/combat restent testés.
- **25 tests Node** et **7 tests PostgreSQL réel jetable** passés localement ; construction Vite réussie (1 597 modules). Les nouveaux tests vérifient les trois sources et sept sorties par hachage, les dimensions/formats, le budget PNG, les imports mipmappés, l’exclusion des métadonnées à l’export et l’isolation des nouvelles ressources.
- Préparation Pillow 11.3.0 relancée sans différence Git : sept PNG, **1 467 280 octets**. Sources conservées hors `game/`, traçabilité et droits non vérifiés dans [`assets/konoha/README.md`](assets/konoha/README.md).
- Import officiel, simulation, export Android debug signé et contrôle des permissions réussis dès la première exécution de 0.8. L’avertissement d’un analyseur statique tiers sur `ConvexPolygonShape3D.points` n’est pas reproduit par Godot 4.5.1 ; le moteur accepte les points et les tests de collision passent.
- Quinze captures ordinateur produites sous Xvfb/Mesa, dont arrivée, marché, maison rapprochée, résidence rapprochée et dialogue. **Arrivée et marché inspectés** : nouveaux volumes, toitures et monument visibles. Aperçus 480×270 compressés conservés dans [`docs/images`](../docs/images/). Pas de test physique Android ni de benchmark.
- Limite d’accès aux preuves : les dix premières notices de l’étape de capture sont accessibles via Checks ; elles contiennent les deux premières vues complètes et une partie de la suivante. Les autres vues existent dans l’artefact selon l’étape réussie, mais n’ont pas été inspectées individuellement. La récupération du journal par `gh run view --log` échoue sur la redirection signée (`EOF`). Pas de compilation supplémentaire uniquement pour ces aperçus ; réduire/prioriser les notices à la prochaine évolution des captures.
- Résidence et maisons en volume ; **visages en décor texturé fixe**, pas sculptés. Les quatre premiers visages correspondent à la résidence fournie ; l’original à sept est conservé, sans nouvelle époque imposée au scénario. Les sources petites ne sont pas annoncées comme de la HD.
- Version **0.8.0**, code **8**, HUD **PROTO 0.8**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7. INTERNET requis ; aucune nouvelle permission sensible.
- APK : **63 335 684 octets**, SHA-256 `7aa69ec3a0bc693393b7d5e8792cfdbc46035b3e3a97246b6662459a7ef71422`.
- [ZIP `idrem-zenkai-android-16`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34471313696/artifacts/10149667934) : **66 640 074 octets**, expiration **17 septembre 2026 à 11:28:10 UTC**, SHA-256 GitHub `2311135762bb1df3f7d63b1ad849b7b2bd45ec6b1728fb72d8dc966f344dc98c`.
- Journaux : `godot-test-logs-16`, artefact **10149666196**, **44 184 octets**. Ce n’est pas l’installateur.
- Aucune modification du serveur, des attributions, du combat, des sons fournis ou de l’accès administrateur. Aucun nouveau déploiement Render requis.

## Historique : mise à jour 0.7.0 — premier quartier de Konoha

[Exécution n° 15](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34459811443), source **`4cc94435634f0dee3d3adda9a53143f21aca1319`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en **1 min 41 s**.

- **178 assertions Godot** : les régressions précédentes plus entrée après rafraîchissement du compte, sol/collisions, marche/saut/atterrissage, monde physique distinct, identité/apparence distante, absence de commandes de combat, multitouch indépendant, dialogue borné, trois panneaux, arrêt des mouvements pendant le dialogue, focus/Retour, récupération après chute, entraînement suspendu, destruction de la visite, nouvelle entrée et refus après expiration.
- **23 tests Node**, **7 tests PostgreSQL** et construction Vite (1 597 modules) réussis. Les fichiers du serveur, son schéma, les règles de combat et les sons ne changent pas dans cet incrément.
- L’exécution n° 14 a détecté une hauteur excessive du dialogue pendant la mesure initiale du texte replié. La largeur minimale du texte et la taille du panneau ont été fixées avant cette compilation réussie ; l’assertion de bornes est conservée.
- Import, simulation, export Android signé et permissions **réussis**. INTERNET toujours requis pour le compte ; autres permissions sensibles refusées.
- Treize captures ordinateur : dix précédentes plus arrivée à Konoha, marché et accueil d’Aoi. **Arrivée et dialogue inspectés** ; pas de benchmark ni d’essai Android physique de 0.7.
- Monde Konoha séparé (`SubViewport` / `World3D`), entraînement désactivé et son rendu coupé pendant la visite. Aucun appel réseau périodique, aucune écriture de progression/récompense/position ni modification de l’apparence hors ligne.
- Version **0.7.0**, code **7**, HUD **PROTO 0.7**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7.
- APK : **61 650 600 octets**, SHA-256 `1fcf895f872253c227110315e2685afb5f8c8e90861bbdccc445635cd8f716da`.
- [ZIP `idrem-zenkai-android-15`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34459811443/artifacts/10145088287) : **63 625 274 octets**, expiration **17 septembre 2026 à 09:19 UTC** ; SHA-256 ZIP GitHub `4621ce6fe770ad6c2d7da396ba61e2edb09c31b73ee3c8a400d6d5af95e5ff75`.
- Utilisation, limites de la visite solo et statut du nettoyage des artefacts : [`docs/KONOHA_PREMIERE_ZONE.md`](../docs/KONOHA_PREMIERE_ZONE.md).

## Historique : mise à jour 0.6.0 — compte natif et apparence persistante

[Exécution n° 13](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34454338018), source **`48704c0b6ae931c741318f76efd250f16bbbe56b`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en **1 min 32 s**.

- **22 tests Node**, **7 tests PostgreSQL** et construction Vite (1 597 modules) réussis. Contrat natif exercé sur SQLite persistant et un PostgreSQL jetable distinct de Neon : admission/attribution préexistante, cookie et jeton séparés, absence d’accès administrateur, identifiants hachés, palettes bornées, conflits concurrents, restauration, expiration, déconnexion et révocation lors du reset de mot de passe.
- **146 assertions Godot**, dont les régressions antérieures plus ouverture du compte sans réseau au démarrage, origine HTTPS bornée/refus de destinations ambiguës, mot de passe vidé, protocole de profil, sauvegarde avec révision, échec/conflit conservant le brouillon, succès uniquement après accusé serveur et absence d’écrasement des choix hors ligne.
- L’exécution n° 12 a détecté le rejet de nombres JSON légitimes après une sauvegarde : Godot décode les nombres en flottants, incompatibles avec une égalité stricte de dictionnaires d’entiers. Le validateur contrôle désormais chaque valeur numérique et une assertion vérifie le passage JSON réel. Les deux régressions de retour de menu associées passent également.
- Import, simulation, export et signature Android réussis. La permission **INTERNET** est maintenant nécessaire et contrôlée ; autres permissions sensibles toujours refusées.
- Dix captures ordinateur produites (arène, course, quatre techniques, pause, deux créateurs, connexion). Formulaire de connexion inspecté, pas d’image de compte réel ni d’identifiants fournis par le propriétaire.
- Aucun changement des sons, effets, coûts, dégâts, vitesses ou recharges. Les apparences du compte ne modifient pas le combattant de l’entraînement. Le monde connecté et la progression restent absents.
- Version **0.6.0**, code **6**, HUD **PROTO 0.6**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7.
- APK : **61 629 445 octets**, SHA-256 `b96606821dea178b9e0b5572405cbe6def6f19dd8ac150c84c027571d2cc06ff`.
- [ZIP `idrem-zenkai-android-13`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34454338018/artifacts/10142873650) : **63 197 671 octets**, expiration **17 septembre 2026 à 08:19 UTC** ; SHA-256 ZIP GitHub `499dd64e477e35766154e588d30ae119e999adaf954613dcc2be0c1d35bd711d`.
- Déploiement, modèle de sécurité, limites de session et protocole : [`docs/COMPTE_JEU.md`](../docs/COMPTE_JEU.md). Aucun secret ni service payant supplémentaire nécessaire.

## Historique : mise à jour 0.5.0 — personnalisation locale

[Exécution n° 11](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34451324752), source **`9e834b7fe9beae4da1ee7cb61bdec142ffb66553`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en **1 min 28 s**.

- **120 assertions Godot**, dont les régressions de combat/audio/effets et les nouvelles vérifications du créateur : neuf choix séparés, aperçu et vue visage, ensemble préservant les traits du personnage, couleurs indépendantes, annulation, validation, relecture disque, remplacement d’une sauvegarde existante, échec d’écriture sans application des choix, récupération après fichier corrompu.
- Vérification que les changements conservent le même objet de collision et les points de vie ; création impossible en plein combat, pause maintenue même après une demande de reprise, gestion de la perte de focus et du bouton Retour Android. Ce sont des événements synthétiques, pas un essai tactile physique.
- **20 tests Node** et construction Vite réussis (1 597 modules). Import et exécution officiels Godot 4.5.1 réussis sans erreur. La première tentative n° 10 a détecté une mauvaise qualification de constante dans le test Retour ; elle a été corrigée en `Node.NOTIFICATION_WM_GO_BACK_REQUEST` avant cette compilation réussie.
- Deux silhouettes habillées, quatre coiffures, palettes bornées, trois hauts et trois bas, quatre ensembles ; géométrie procédurale originale. Un aperçu dans un monde 3D séparé, rendu désactivé à la fermeture du créateur. Pas de mesure FPS Android.
- Sauvegarde **locale uniquement** : fichier JSON versionné, taille de lecture limitée à 8 192 octets, identifiants validés et champs inconnus ignorés. Remplacement via fichier temporaire. Pas de connexion au site ni de sauvegarde de compte/clan/progression. Désinstallation ou effacement des données = perte de l’apparence locale.
- Les neuf sons fournis, le warning, Katon/Raiton/Fūton/Doton et les règles de combat sont inchangés. Le site, les comptes et `main` ne sont pas modifiés.
- Export debug signé, contrôle des permissions, neuf captures ordinateur (sept scènes précédentes + deux créateurs) : **réussis**.
- Version **0.5.0**, code **5**, HUD **PROTO 0.5**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7.
- APK : **61 612 743 octets**, SHA-256 `111b3ec41e8da7bb4fc4fca380d0179393098c597c330b701e0cd94b5528af00`.
- [ZIP `idrem-zenkai-android-11`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34451324752/artifacts/10141691454) : **63 110 469 octets**, expiration **17 septembre 2026 à 07:44 UTC** ; SHA-256 ZIP GitHub `b215747edab8bff2b8cdefe3aa09e334a0b708fe27a4b307cb53d80a41d3a33e`.

## Historique : mise à jour 0.4.0 — flammes et foudre

[Exécution n° 9](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323), source **`85a68db91d6b05dd6e3e9adb849d9ab6e83cdb69`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en **1 min 23 s**.

- **90 assertions Godot** : les 81 précédentes, plus couches de flammes, animation de l’atlas, profondeur/taille dans le monde, embrasement et nettoyage, trois maillages d’éclair ramifiés, extrémités préservées et trois renouvellements visuels sans dégâts supplémentaires.
- **19 tests Node** et construction Vite réussis ; aucun changement du site. L’analyse GDScript locale a retourné zéro diagnostic ; l’import et l’exécution officiels en CI ont confirmé la validité moteur.
- Katon : atlas RGBA original de huit images, trois sprites partageant la même texture, flammes de traînée et d’impact. Raiton : halo/canal/cœur regroupés, branches et couronnes électriques, durée de 0,36 s.
- Aucun éclairage dynamique ni particules GPU, trois renouvellements de géométrie maximum par éclair et 14 groupes secondaires maximum. **Pas de mesure de FPS sur Android** : ces budgets sont des précautions, pas une garantie de fluidité sur tous les appareils.
- Sons et paramètres de combat inchangés. Le projectile garde sa collision, ses 18 m/s et sa durée de 1,8 s ; Raiton reste un seul rayon de dégâts de 15 m. Fūton, Doton, course et commandes conservés.
- Export signé, vérification des permissions, captures ordinateur et inspection des deux effets : **réussis**. Les aperçus sont découpés en annotations de moins de 4 096 caractères pour éviter la troncature de l’API Checks.
- Version **0.4.0**, code **4**, HUD **PROTO 0.4**, paquet `org.idremzenkai.training`, API minimum 24/cible 35, ARM64 et ARMv7.
- APK : **61 596 055 octets**, SHA-256 `3c409ae7e88ed7f2f30fe1aac775265338a7db9c45e1f6d662466c08290e3794`.
- [ZIP `idrem-zenkai-android-9`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323/artifacts/10141009252) : **62 950 239 octets**, expiration **17 septembre 2026 à 07:23 UTC** ; SHA-256 ZIP GitHub `5f7db4a075fea02a7cff6cbe748a3c34e5ddd114b2556a85a879d49d2f89c98e`.

## Historique : mise à jour 0.3.0 — enregistrements du propriétaire

[Exécution n° 6](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34446543408), source **`5a2b800368dcd7885b9540579f18138101bc8811`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en **1 min 28 s**.

- **81 assertions Godot** : ressources chargées à leur durée préparée complète, musique fournie en boucle, un seul exemplaire d’un effet répété, noms inconnus refusés, plus les régressions de combat/commandes/pause/visuels.
- **18 tests Node**, compilation Vite réussie. Vérification des empreintes sources/sorties, durées, PCM, crêtes, gains bornés et exclusion des sources brutes de l’import/export.
- Les 10 WAV (9 fichiers fournis + warning) ont été reproduits octet pour octet dans un dossier temporaire avec FFmpeg **7.0.2** et le script de préparation.
- Les originaux proviennent du commit `e166940b8aff1bfdb9fa9eb4d874fb7a04bfa58b` de `main`. La branche `main` et ses fichiers n’ont pas été modifiés. Fichiers identiques `dodge.mp3`/`melee.mp3` conservés selon l’association demandée.
- Les fichiers portent `.mp3` mais contiennent de l’AAC/MP4. La conversion conserve les horodatages (silences internes compris), retire seulement les silences extérieurs et applique des fondus/gains limités. Détails par son dans `game/assets/audio/manifest.json`.
- Le générateur ancien a été limité au warning ; il ne peut plus écraser les neuf fichiers fournis. Aucun changement de dégâts, vitesse, recharge, compte ou candidature.
- Export debug signé, contrôle des permissions et captures de rendu **réussis**. La CI utilise un pilote audio Dummy : validation technique, **pas une écoute humaine du mix ni un test sur Android physique**.
- Version **0.3.0**, code **3** ; paquet `org.idremzenkai.training`, API min 24/cible 35, ARM64/ARMv7.
- APK : **61 530 023 octets** ; SHA-256 `d2b41b3dafaf5cfb462782cc5232d90fbf45ad0f9404a3ae016ddad5678185fa`.
- [ZIP `idrem-zenkai-android-6`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34446543408/artifacts/10139893231) : **62 880 104 octets**, expiration **17 septembre 2026** ; SHA-256 ZIP fourni par GitHub `ae962096676391520480d721cdba5bd60f7c11cb43284701b3c09b29b92cb4ed`.

## Historique : mise à jour 0.2.0 — logo, course, effets et audio

[Exécution n° 5](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34442311612), source **`21bb0e6e2ff2b8b3ba56b662166f64a6f65c39a4`**, branche `arena/01a08158-matchly-project`. Toutes les étapes ont réussi en 1 min 42 s.

- **78 assertions Godot** passées avec l’éditeur officiel 4.5.1 : les anciennes règles plus absence d’image dans le HUD, menu et réglages audio, ressources WAV, lecture/boucle, pause/silence, course bras en arrière, frappe vers l’avant, retour au repos, budget et nettoyage des effets, refus de son pour une technique en recharge.
- **17 tests Node** et compilation Vite réussis. Les 10 fichiers WAV sont des PCM mono 16 bits/22 050 Hz, non silencieux, sous le seuil de saturation et avec une jonction de boucle bornée. Génération originale reproductible, aucun échantillon externe.
- La CI emploie le pilote audio **Dummy** : elle valide les ressources, états de lecture et branchements, **pas une écoute du mix final**. Les niveaux et timbres réels restent à apprécier sur téléphone.
- Capture de rendu réussie pour l’arène, la course de profil, les quatre techniques et la pause ; pas d’inspection visuelle locale des artefacts, ni de mesure des FPS Android.
- Export signé de test, contrôles `apksigner` et permissions réussis.
- Version `0.2.0`, code **2** ; paquet inchangé `org.idremzenkai.training`. API minimum 24/cible 35, ARM64 et ARMv7.
- APK : **59 621 287 octets**. SHA-256 : `5c83040b08079cb8917284a161da959498c06d377cc8adbf59a6ec0ea502678f`.
- [ZIP `idrem-zenkai-android-5`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34442311612/artifacts/10138409957) : **60 953 817 octets**, expiration le 17 septembre 2026. SHA-256 ZIP GitHub : `10e61af872fd99874e0c51057007c7c035034b698d62380f80deb40a23063434`.

Retour utilisateur ayant motivé la correction : bonne fluidité dans 0.1.0, mais image du logo gênant la vue. Le `TextureRect` de logo a été entièrement retiré du HUD plutôt que seulement redimensionné. L’icône du lanceur reste indépendante. Ni dégâts, coûts/recharges, comptes ni données de production n’ont été modifiés.

## Historique : première compilation Android réussie

[Exécution n° 4](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34440928876), source **`472cdf686137806eace06fbedf9050a422b90dcc`**, branche `arena/01a08158-matchly-project`, 10 septembre 2026. Toutes les étapes ont réussi en 1 min 42 s, avec l’éditeur **officiel Godot 4.5.1**.

- APK : `idrem-zenkai-training-debug.apk`, **58 807 965 octets**.
- Paquet : `org.idremzenkai.training`, version `0.1.0`, code `1`.
- Architecture : `arm64-v8a` et `armeabi-v7a`.
- Minimum Android : **API 24** ; cible et compilation : **API 35**.
- SHA-256 APK : `acf7b9e66fdba6eeb22eb63dc0af254f79459827b6620a71eb9a41758b15b8f3`.
- [Artefact ZIP `idrem-zenkai-android-4`](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34440928876/artifacts/10137929188) : **59 864 021 octets**, expiration 17 septembre 2026.
- SHA-256 ZIP fourni par GitHub : `a99e05c34c758caea5fc92ee1079f24df790b2f307a73763cda76d3b45585b8f` (distinct du SHA de l’APK).

Les données de paquet et le SHA APK proviennent de l’annotation « Verified Android APK » produite après les contrôles dans la CI. Les métadonnées et le succès des étapes ont été consultés via l’API GitHub. Le bac à sable ne peut pas télécharger les journaux/artefacts depuis les hôtes de stockage redirigés ; les fichiers sont à récupérer depuis GitHub avec le navigateur.

Les premières tentatives ont permis de corriger deux exigences de l’export standard : ne pas définir de niveaux SDK personnalisés sans Gradle et activer l’import de textures ETC2/ASTC pour Android. Des assertions Node empêchent leur régression. Les avertissements de dépréciation des actions v4/Node 20 n’ont pas bloqué la compilation ; leur migration nécessitera une modification du workflow autorisée par son propriétaire.

## Ce que les tests Godot couvrent

- Coût du chakra facturé une seule fois ; refus sans ressource et pendant recharge.
- Recharges indépendantes, pas de recharge globale ; régénération exacte à la frontière combat/hors combat.
- Ouverture du menu en pause ; bouton de lancement avec les clics émulés des écrans tactiles.
- Bornes des menus et des boutons dans le viewport paysage de référence, sans prétendre valider tous les écrans/encoches.
- Entrées synthétiques : joystick + caméra + technique avec trois identifiants tactiles ; libération des doigts et course activée une seule fois.
- Aucun coup involontaire déclenché par le clic souris émulé d’un toucher de joystick.
- Capsule sur le sol, mouvement relatif à la caméra, saut, esquive et dégâts.
- Gel du mouvement et des quatre recharges pendant la pause.
- RAITON touchant la cible, projectile KATON entrant en collision avec elle, FŪTON appliquant dégâts/recul, DOTON annonçant sa zone puis infligeant une seule frappe différée.
- Mur empêchant la sortie de l’arène.
- Victoire, défaite et réinitialisation des deux combattants.
- Annonce de l’attaque ennemie avant les dégâts.
- Perte de focus mettant en pause et annulant les entrées maintenues ; reprise utilisable.

## Historique : moteur utilisé pour les premiers tests locaux

Les téléchargements des binaires officiels étaient inaccessibles dans le bac à sable. Un moteur de test a donc été compilé depuis les **sources officielles Godot 4.5.1**, tag `4.5.1-stable`, commit `f62fdbde15035c5576dad93e586201f4d41ef0cb`.

Version affichée : `Godot Engine v4.5.1.stable.custom_build.f62fdbde1`.

Compilation Linux x86_64 éditeur, GCC, sans optimisation, **sans pilote graphique ni bibliothèques multimédias système**, avec GDScript, FreeType, regex, TextServer fallback, SVG et GodotPhysics 2D/3D. Le contrôle de présence de `pkg-config` a été neutralisé uniquement dans la copie locale du détecteur de compilation car ces intégrations système étaient désactivées. Aucune logique GDScript, physique ou de jeu du moteur n’a été modifiée. Cette copie de travail et ses gros fichiers sont hors du dépôt.

L’import a produit des erreurs indiquant l’absence de `fontconfig` et des avertissements de locales/occlusion propres à cette compilation réduite. **Le script strict `tools/check.sh` a correctement refusé ce journal d’import : il n’est pas présenté comme réussi.** Après l’import, le lancement direct de la simulation a réussi sans erreur :

```bash
godot --headless --path game --script res://tests/smoke.gd
# 47 lignes PASS, puis IDREM_SMOKE_FAILURES=0 ; sortie 0
```

La compilation GitHub prévue emploie, elle, l’éditeur officiel complet et les modèles d’export officiels, vérifiés par SHA-256. Elle a désormais passé `tools/check.sh`, l’export, `apksigner`, le contrôle des permissions et les captures de rendu dans l’exécution n° 4. Aucun filtre n’a été ajouté pour masquer ces erreurs dans la future CI.

## Éléments de production préservés

Pendant ces travaux, aucun appel au service Render/Neon de production, aucune modification des comptes/candidatures/clans réels, aucun SDK installé sur Render et aucune migration de la vraie base. Les tests utilisent des données isolées. Le code 0.6 ajoute des tables de session/apparence et des routes natives : elles seront activées au déploiement manuel du serveur. La branche `main` reste inchangée. Paquet Android : `org.idremzenkai.training`.
