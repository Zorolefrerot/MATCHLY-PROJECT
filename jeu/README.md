# Mémo Vive — le jeu

Aventure 2D en vue de dessus à l'intérieur d'un **téléphone** (comme dans *Le Monde
des Emoji*, avec l'esprit des *Mondes de Ralph*) : le joueur incarne **PIX**, un
pixel-emoji chargé des **missions essentielles au fonctionnement de l'appareil**.

Le document de conception complet est dans [`docs/jeu-design.md`](../docs/jeu-design.md).

## Ce que contient ce prototype (phase 0/1)

- **L'Écran d'accueil** : la ville-hub avec 9 bâtiments d'applis parodiques
  (AmiBook, VidiTube, Bonbon Smash, Marbouilles, ChronoMail, Blabla, Navik,
  ClipClip), la Boutique, la Batterie, l'antenne WiFi et la statue de l'Horloge.
- **Déplacement libre** vue de dessus : clavier (ZQSD/WASD/flèches) et
  **joystick tactile + bouton A** sur mobile.
- **Mission « Batterie critique »** : récupérer 5 éclats d'énergie dans les rues,
  puis les rapporter à la Batterie → +100 Mo.
- **Boutique** : dépenser des Mo (Chapeau Pixel cosmétique).
- **PNJ animés** : CURSEUR (guide), HORLOGE, et trois emojis bavards.
- **Dialogues** avec effet machine à écrire, **FR/EN** commutables dans le menu pause.
- **Sauvegarde** locale (`user://save.json`) : langue, Mo, mission, objets.
- **Tout l'art et les sons sont générés par code** (aucun asset binaire requis).

## Ouvrir le projet dans Godot

1. Installer **Godot 4.7.2** (ou toute version 4.7.x) : https://godotengine.org/download
2. `Importer` → sélectionner `jeu/project.godot`.
3. Appuyer sur **F5** (Lancer le projet principal).

Contrôles clavier : **ZQSD / WASD / flèches** pour bouger, **E** ou **Espace** pour
agir, **Échap** pour la pause. Sur mobile : joystick à gauche, bouton **A** à droite,
bouton **II** pour la pause.

## APK Android

Le workflow GitHub Actions **« Mémo Vive Android APK »**
(`.github/workflows/jeu-godot-android.yml`) s'exécute à chaque modification de `jeu/`
sur la branche de travail. Il :

1. vérifie chaque script GDScript (`--check-only`) ;
2. importe le projet et teste son démarrage en mode headless ;
3. exporte l'APK Android (arm64) avec Godot ;
4. l'aligne (`zipalign`), le **signe** avec une clé de test stable et vérifie la
   signature (`apksigner`) ;
5. publie `MemoVive-Android.apk` dans la release GitHub
   `memovive-android-test-v0.1.0` → à télécharger directement depuis un téléphone.

Le paquet de test est `cd.memovive.game` (clé de **débogage** : ne pas utiliser pour
une publication sur le Play Store — une clé de production sera nécessaire le moment venu).

## Structure

```
jeu/
├── project.godot            # configuration (Godot 4.7, GL Compatibility)
├── icon.svg
├── autoload/
│   ├── game.gd              # état global : Mo, mission, dialogues, i18n FR/EN, sauvegarde
│   └── sfx.gd               # sons générés par code (AudioStreamWAV)
├── scripts/
│   ├── art.gd               # tout le pixel-art généré par code
│   ├── touch_joy.gd         # joystick virtuel tactile
│   ├── actors/player.gd     # PIX (déplacement, interactions)
│   ├── actors/npc.gd        # habitants (emojis, CURSEUR, HORLOGE)
│   ├── world/building.gd    # bâtiments d'applis
│   └── ui/hud.gd            # interface (objectif, Mo, dialogues, boutique, pause)
└── scenes/                  # scène principale + écran d'accueil
```

## Prochaines étapes (voir `docs/jeu-design.md`, feuille de route)

- Ennemis (pop-ups publicitaires, vers) et zones corrompues ;
- mini-jeux jouables (Bonbon Smash, Marbouilles, ChronoMail) ;
- quartier Batterie étendu, capteurs, mode économie ;
- puis l'acte 2 : le PC (CPU, RAM, GPU, disque dur, corbeille…).
