# Rapport final — DIGITAL WORLD : BEYOND THE SCREEN

**Étape 01 · Prototype 0.1.0 · 4 novembre 2026**

## 1. Résultat livré

Un véritable projet **Godot 4.4.1 Standard / GDScript / 3D Compatibility**, indépendant de ShopFlow, et un **APK Android de débogage signé** ont été produits. Le jeu ne dépend d'aucun serveur et n'utilise pas les services du dépôt existant.

**Validation automatisée : réussie. Validation sur téléphone réel : non effectuée.** Il s'agit d'un premier prototype jouable et extensible, pas d'une version commerciale finale.

- Code du jeu vérifié : `53b39585d4c29d900ea7b89842e3ed8a5640e2ce`.
- [Exécution GitHub Actions réussie](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/41750985719).
- [Télécharger DigitalWorld-Android-debug](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/41750985719/artifacts/13285479590) : ZIP contenant l'APK et son fichier de contrôle SHA-256.
- [Captures natives du menu et du gameplay](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/41750985719/artifacts/13285833840).
- [Journaux de validation](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/41750985719/artifacts/13285609175).

Les artefacts GitHub sont conservés 14 jours et peuvent nécessiter une connexion GitHub. Relancer le workflow après leur expiration. Les restrictions réseau du sandbox empêchent de rapatrier les artefacts depuis le CDN de stockage GitHub : l'APK est donc fourni via le lien de téléchargement GitHub, **pas comme un fichier APK local prétendument disponible**.

## 2. Inspection de l'environnement

| Point | Constat réel |
|---|---|
| Dépôt existant | ShopFlow web/Android ; aucun projet Godot trouvé |
| Godot local | Aucun exécutable préinstallé |
| Création/import 3D | Aucun Blender installé ; modèles originaux créés dans Godot avec primitives partagées |
| Android local | Aucun JDK, SDK Android, ADB ou Gradle préinstallé |
| Réseau | Sources accessibles par GitHub/codeload ; hôtes des binaires et des artefacts bloqués localement |
| Tentative locale | Compilation du moteur headless depuis les sources 4.4.1 amorcée, puis arrêtée lorsque la validation officielle distante était opérationnelle ; aucun succès de compilation locale n'est revendiqué |
| Environnement de validation | Runner Ubuntu 24.04, Godot officiel 4.4.1, JDK 17, SDK/platform 35, build-tools 35.0.0 |

ShopFlow est conservé. Seuls son README et le `.gitignore` racine ont été complétés pour référencer et isoler le jeu. Les modifications sont sur `arena/df0758e5-matchly-project`, pas sur `main`.

## 3. Architecture, scènes et scripts

L'[architecture complète](ARCHITECTURE.md) décrit les dossiers, les responsabilités, les flux de signaux et les extensions prévues.

### Sept scènes du jeu

| Scène | Rôle |
|---|---|
| `scenes/main.tscn` | Composition et orchestration de l'aventure |
| `scenes/characters/byte.tscn` | BYTE, capsule et contrôleur physique |
| `scenes/characters/orbit_camera.tscn` | Pivot, SpringArm3D et Camera3D |
| `scenes/worlds/system_city.tscn` | Ville centrale et environnement |
| `scenes/worlds/world_prop.tscn` | Base de PNJ et d'objets interactifs |
| `scenes/ui/game_hud.tscn` | Mission, vie, joystick, actions et dialogues |
| `scenes/ui/menu.tscn` | Accueil, pause, paramètres et confirmation |

Deux scènes de validation supplémentaires : `tests/test_runner.tscn` et `tests/visual_smoke.tscn`.

### Vingt et un scripts de production

- **Composition :** `main.gd`.
- **Art :** `art/shapes.gd`.
- **Personnage/caméra :** `characters/byte_visual.gd`, `characters/player.gd`, `characters/orbit_camera.gd`.
- **Monde :** `worlds/city_art.gd`, `worlds/system_city.gd`, `worlds/world_prop.gd`.
- **Systèmes :** `systems/mission.gd`, `systems/game_state.gd`, `systems/save_store.gd`, `systems/dialogue.gd`, `systems/interactable.gd`, `systems/interaction_scanner.gd`, `systems/world_router.gd`, `systems/audio.gd`.
- **Interface :** `ui/ui_style.gd`, `ui/menu.gd`, `ui/game_hud.gd`, `ui/virtual_joystick.gd`, `ui/touch_action.gd`.

Deux scripts de tests, deux générateurs Python d'assets, les dialogues JSON, le layout audio et le preset d'export complètent le projet. Les décors, personnages et animations sont construits à l'exécution : lancer la scène pour les voir, plutôt que s'attendre à des meshes déjà visibles dans l'éditeur à l'arrêt.

## 4. Fonctionnalités implémentées et exercées

- **BYTE 3D original**, tenue numérique, visage lumineux, clignements des yeux et articulations animées.
- **Neuf animations AnimationPlayer** : Idle, Walk, Run, Jump, Falling, Landing, Interaction, Hit, Death. Modèle articulé rigide, pas un personnage skinné importé.
- Locomotion relative à la caméra, marche/course, saut, gravité, rotation, collisions et réapparition.
- Caméra troisième personne avec suivi lissé, rotation tactile/souris et rétraction physique par SpringArm.
- **System City** : place, point de réveil, routes/circuits lumineux, six bâtiments principaux, atelier accessible, jardins numériques, panneaux, monument de données, habitants et portail fermé.
- NOVA flottante, PATCH mécanicien et MÉMO ; NULL apparaît sous forme de corruption et de failles, sans révéler son identité.
- Détection d'interaction par proximité et ligne de vue ; dialogues, collecte, terminal et porte mobile réellement collisionnée.
- **Un monde en panne** : tutoriel de déplacement, place, NOVA, terminal, trois fragments identifiés, réparation, retour à NOVA, récompense unique de 50 énergie et badge.
- Identifiant **`le_signal_de_patch`** explicitement débloqué et restauré dans la progression ; contenu de cette seconde mission non livré.
- HUD paysage, joystick analogique, course au bord du joystick, saut, interaction, scan de l'objectif, vie, distance et pause.
- Menu principal sur ville 3D animée : nouvelle partie avec confirmation, continuer, paramètres, quitter.
- Musique et sept effets synthétiques originaux, volumes séparés, pool de lecteurs et fermeture propre de l'audio.
- Sauvegarde locale atomique, validation des données, copie de secours, checkpoints sûrs, paramètres et reprise.
- Preset Android natif et compilation CI reproductible ; aucune permission Internet.

## 5. Tests effectués et résultats

| Vérification réellement exécutée | Résultat |
|---|---|
| Analyse syntaxique des GDScript avec gdtoolkit | Réussie |
| Import officiel `godot --headless --editor --import` | Réussi |
| Suite Godot `res://tests/test_runner.tscn` | **85 assertions, 0 échec** |
| Ordre des objectifs, fragments inconnus/doublons, réparation et récompense unique | Réussi |
| Mission suivante explicitement débloquée puis restaurée | Réussi |
| Sauvegarde disque, backup, corruption récupérée, version/position/état invalides | Réussi |
| Sauvegarde après corruption sans écraser un backup valide | Réussi |
| Paramètres écrits et relus ; bus Musique et SFX chargés | Réussi |
| Dialogues et callback final exécuté une seule fois | Réussi |
| Instanciation du menu, du HUD, des neuf interactifs et des neuf animations | Réussie |
| Déplacement physique sur la place, saut et retour au sol | Réussi |
| Bâtiment et porte fermée bloquants ; passage après ouverture | Réussi |
| Rétraction physique du bras caméra devant une façade | Réussie |
| NOVA détectée par proximité ; dialogue bloque les déplacements | Réussi |
| Mission complète jusqu'à réparation, récompense et reprise par Continuer | Réussie |
| Dégâts NULL, animation Death et réapparition automatique | Réussi |
| Pause/reprise, notifications retour Android simulées | Réussi |
| Événements tactiles synthétiques joystick/saut, axe remis à zéro, delta caméra | Réussi |
| Rendu natif Compatibility sous Xvfb/Mesa logiciel | **Réussi**, images du menu et du gameplay produites et contrôlées non vides |
| Export Android Godot, `apksigner verify`, package et absence d'INTERNET | **Réussis** |
| Non-régression du dépôt existant : `npm run test:api` | **9 tests réussis sur 9** |
| `git diff --check` | Réussi |

La suite de mission intègre des déplacements physiques réels, mais elle appelle directement certains handlers pour les phases de dialogue/collecte. Les événements tactiles sont synthétiques. **Ces résultats ne sont ni un playtest humain, ni une installation Android, ni une preuve de confort multi-touch sur appareil.**

Le test graphique confirme que le moteur rend des images natives ; il ne remplace pas une revue artistique humaine détaillée. Le son est chargé et exécuté dans les tests, mais son mixage n'a pas fait l'objet d'une écoute matérielle sur téléphone.

## 6. Problèmes rencontrés et corrigés

1. **Outils locaux absents et téléchargements bloqués :** export et validation déplacés vers GitHub Actions avec les outils officiels.
2. **Cycle des autoloads dans un test lancé comme script autonome :** tests convertis en scènes Godot normales.
3. **Bus audio introuvables :** correction de la clé projet en `audio/buses/default_bus_layout` et ajout d'une assertion dédiée.
4. **JSON corrompu produisant une erreur moteur malgré récupération :** usage de `JSON.parse()` avec résultat contrôlé, plutôt que du helper statique qui journalisait l'erreur attendue.
5. **Playbacks WAV encore actifs à la fermeture du driver de test :** arrêt et libération explicites, puis attente d'un court cycle avant sortie.
6. **Signature Android partiellement configurée :** utilisation cohérente du keystore et des identifiants de débogage des paramètres éditeur.
7. **Export Android refusé sans message explicite :** activation du format d'import mobile ETC2/ASTC exigé par Godot.
8. **Artefacts distants non téléchargeables depuis le sandbox :** liens GitHub fournis, sans prétendre que le binaire a été copié localement.

Les avertissements de dépréciation de certaines versions d'actions GitHub restent non bloquants ; ils ne sont pas des erreurs du jeu.

## 7. Limites et fonctionnalités non terminées

- **Installation et exécution sur smartphone réel non testées**, aucun émulateur Android utilisé.
- Cible **30 FPS non mesurée** sur appareils d'entrée/milieu de gamme. Le mode économie limite la cadence et désactive les ombres, mais ne garantit pas à lui seul cette performance.
- Multi-touch réel à trois doigts, ratios extrêmes, encoches, chauffe, consommation et interruptions Android restent à recetter.
- Animations articulées et expressivité de prototype : pas encore de skinning, IK des pieds ou motion capture. Le contrôleur utilise les collisions physiques ; l'absence de glissement perceptible sous tous les angles reste à apprécier en playtest.
- NOVA guide BYTE depuis sa balise dans cette mission ; comportement de compagnon suiveur non livré.
- Autres mondes, mini-jeux, applications, chapitre PATCH et véritable campagne non développés.
- Le registre `WorldRouter` prépare l'extension ; transitions inter-mondes animées/asynchrones non exposées dans ce premier monde.
- Inventaire métier minimal fonctionnel ; pas encore d'écran d'inventaire général ni de gestionnaire multi-missions complet.
- Pas de doublage vocal, de publication Play Store, d'AAB ou de signature de production durable.

## 8. Lancer le projet

Importer **`digital-world/project.godot`** dans Godot **4.4.1 Standard**, attendre l'import, puis **F5**. Pas de dépendance npm, Python ou Blender nécessaire pour jouer : les fichiers audio et l'icône sont déjà fournis.

**PC :** ZQSD/WASD/flèches, Maj pour courir, Espace pour sauter, E pour interagir/avancer les dialogues, F pour scanner, clic droit glissé pour la caméra, Échap pour la pause.

**Android :** décompresser l'artefact GitHub, copier `DigitalWorld-debug.apk` sur l'appareil, autoriser l'installation depuis cette source si Android le demande, puis installer. Ou utiliser `adb install -r DigitalWorld-debug.apk`. Une ancienne build avec une autre clé de debug doit être désinstallée avant installation, ce qui supprime son stockage local.

Les instructions complètes d'export sont dans le [README](../README.md). La [recette Android](ANDROID_TEST_PLAN.md) détaille la validation matérielle à faire ensuite.

## 9. État exact de la compilation Android

| Élément | Valeur vérifiée |
|---|---|
| Résultat CI | **Succès**, job complet de 1 min 11 s |
| Nom | `DigitalWorld-debug.apk` |
| Version | `0.1.0`, code 1 |
| Package | `cd.digitalworld.beyondscreen` |
| Preset | Android natif, ARMv7 et ARM64, Compatibility, paysage |
| Taille APK | **54 697 025 octets**, environ 54,7 Mo |
| Signature | Signature de débogage vérifiée avec `apksigner` |
| Réseau | Absence de permission `android.permission.INTERNET` vérifiée |
| Installation réelle | **Non effectuée** |

SHA-256 :

```text
7b087b2331699d60b56e205758d5900eb9155dfee2995a9e23dc7183f74e07e8
```

**Conclusion :** le prototype est implémenté, testé automatiquement, rendu nativement et exporté en APK signé. La prochaine priorité est de tester **cette build sur téléphone**, corriger les éventuels problèmes matériels et mesurer le framerate avant d'ajouter un autre monde.
