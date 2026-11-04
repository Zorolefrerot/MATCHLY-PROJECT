# DIGITAL WORLD — BEYOND THE SCREEN

Prototype 3D original, solo et hors ligne, en **Godot 4.4.1 / GDScript / Compatibility**. Android paysage, avec commandes PC pour le développement. Le projet est indépendant de ShopFlow ; aucun de ses services ni assets n'est utilisé.

## Ouvrir et jouer

1. Installer **Godot 4.4.1 Standard** (pas besoin de .NET).
2. Importer `digital-world/project.godot` dans le gestionnaire de projets.
3. Laisser l'import audio se terminer, puis **F6** sur `scenes/main.tscn` ou **F5**.
4. Choisir **Nouvelle partie**. Lire l'objectif en haut à gauche. Les losanges dorés indiquent les objectifs.

| Action | Android | PC |
|---|---|---|
| Se déplacer | Joystick gauche | ZQSD, WASD ou flèches |
| Courir | Pousser le joystick au bord | Maintenir Maj |
| Regarder | Glisser en haut à droite | Glisser avec clic droit |
| Sauter | SAUT | Espace |
| Interagir / dialogue suivant | INTERAGIR / CONTINUER | E |
| Scanner l'objectif | SCAN | F |
| Pause | PAUSE / retour Android | Échap |

L'atelier s'ouvre depuis sa porte, dans la rue est. PATCH et MÉMO ont des dialogues facultatifs. Les failles violettes infligent des dégâts : sauter permet de les éviter. Le portail reste volontairement verrouillé.

### Première mission : Un monde en panne

Se déplacer → rejoindre la place centrale → parler à NOVA → examiner le terminal au nord → récupérer les trois fragments dans les allées → réparer le terminal → revenir à NOVA. Récompense : **50 énergie + badge de maintenance**. La mission suivante est annoncée et son identifiant est débloqué dans la sauvegarde, **pas encore jouable**.

### Sauvegarde

Sauvegarde automatique à chaque changement de mission, collecte, pause et suspension Android. La reprise se fait au **dernier point sûr**, pas à la position exacte de fermeture. Fragments et récompenses restent acquis après un respawn.

Fichiers Godot `user://adventure.json`, `.bak` et `settings.json`, dans le stockage privé de l'application. Pas de compte, réseau, permission de stockage partagé ni serveur. Une sauvegarde JSON illisible ou invalide est remplacée à la lecture par sa copie de secours si elle est valide. Nouvelle partie demande confirmation si une partie existe.

## Tests automatiques

```sh
cd digital-world
godot --headless --editor --import
godot --headless res://tests/test_runner.tscn
```

Les tests emploient `user://test_adventure.json` et `user://test_settings.json`, pas le slot du joueur. Ils testent la logique métier, les fichiers, les dialogues, l'instanciation de la scène, les déplacements physiques, le saut, les obstacles, le bras caméra, la porte, la mort/réapparition et le parcours de mission. Le workflow effectue également un test graphique natif Compatibility et produit deux captures. Le parcours scénaristique appelle certains handlers directement : ce n'est **pas** un playtest humain ou un test sur téléphone. Voir `docs/VALIDATION.md` pour les résultats effectivement obtenus.

## APK de cette étape

**Compilation vérifiée :** [télécharger l’artefact Android 0.1.0](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/41750985719/artifacts/13285479590). Décompresser le ZIP pour obtenir `DigitalWorld-debug.apk` (54,7 Mo). [Rapport et résultats : 85 assertions réussies](docs/VALIDATION.md). Installation sur téléphone réel encore à vérifier.

## Compiler un APK

### GitHub Actions

Workflow **Digital World — Godot tests and Android APK**, déclenché par un push sur la branche de session pour les fichiers du jeu, ou manuellement via `workflow_dispatch`. Il télécharge Godot 4.4.1 officiel et les templates Android, installe JDK 17 / SDK Android 35, importe le projet, exécute les tests, exporte un APK de débogage signé et vérifie son package et sa signature.

Télécharger l'artefact **DigitalWorld-Android-debug** depuis l'exécution réussie du workflow. Le ZIP contient `DigitalWorld-debug.apk` et `SHA256SUMS.txt`. Les artefacts expirent après 14 jours : relancer le workflow si nécessaire. La clé de debug du runner n'est pas une clé de production et n'est pas persistée ; désinstaller une ancienne build si Android refuse une mise à jour pour signature différente.

### Localement

1. Installer JDK 17, Android SDK / platform-tools, platform 35 et build-tools 35.0.0.
2. Dans Godot : **Éditeur → Gérer les modèles d'export → Télécharger et installer** la version 4.4.1.
3. Dans **Paramètres de l'éditeur → Export → Android**, renseigner Java SDK Path et Android SDK Path. Configurer ou générer un debug keystore.
4. **Projet → Exporter → Android → Exporter le projet**, en mode debug. Ou :

```sh
mkdir -p exports
godot --headless --export-debug Android exports/DigitalWorld-debug.apk
adb install -r exports/DigitalWorld-debug.apk
```

Package : `cd.digitalworld.beyondscreen`. ABI ARMv7 et ARM64. Export natif avec les templates standard, **sans Gradle personnalisé**. Aucune permission Internet. L'APK est un prototype de test, pas une publication Play Store.

## Organisation

Voir [l'architecture](docs/ARCHITECTURE.md), [la validation](docs/VALIDATION.md) et [la recette Android](docs/ANDROID_TEST_PLAN.md).

## Assets et limites

Modèles et décors originaux générés par les scripts d'art : géométrie low-poly partagée, pas de texture externe. BYTE possède neuf animations par articulations rigides, pilotées par `AnimationPlayer`, pas un squelette skinné importé. Musique et effets synthétiques originaux reproductibles avec `python3 tools/generate_audio.py` (bibliothèque standard, sans échantillons tiers).

Le projet vise 30 FPS avec le mode économie par défaut. **Aucune mesure sur smartphone n'est encore revendiquée.** Ombres optionnelles, un seul éclairage directionnel, décoration statique regroupée en MultiMesh, pas de post-traitement lourd, audio mono compressé à l'import.
