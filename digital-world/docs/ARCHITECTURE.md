# Architecture technique — prototype 01

## Arborescence

```text
digital-world/
├── project.godot                 # Godot 4, Compatibility, paysage 1280×720
├── export_presets.cfg            # Android ARMv7 + ARM64, hors ligne
├── scenes/
│   ├── main.tscn                 # Composition de l'aventure
│   ├── characters/
│   │   ├── byte.tscn             # CharacterBody3D, capsule, visuel articulé
│   │   └── orbit_camera.tscn     # Pivot → SpringArm3D → Camera3D
│   ├── worlds/
│   │   ├── system_city.tscn      # Monde central
│   │   └── world_prop.tscn       # Scène réutilisable d'objet/PNJ interactif
│   └── ui/
│       ├── game_hud.tscn         # Mission, vie, commandes, dialogues
│       └── menu.tscn             # Accueil, pause, réglages, confirmation
├── scripts/
│   ├── main.gd                  # Orchestrateur, règles de la première mission
│   ├── art/shapes.gd            # Matériaux/meshes partagés et MultiMesh
│   ├── characters/
│   │   ├── byte_visual.gd       # Modèle original + neuf animations
│   │   ├── player.gd            # Physique, locomotion, dégâts, respawn
│   │   └── orbit_camera.gd      # Rotation, suivi lissé, anticollision
│   ├── worlds/
│   │   ├── city_art.gd          # Plan urbain et modules architecturaux
│   │   ├── system_city.gd       # Placement, environnement et synchronisation
│   │   └── world_prop.gd        # NOVA, PATCH, MÉMO, terminal, fragments, porte, portail
│   ├── systems/
│   │   ├── mission.gd           # Machine à états et inventaire de mission
│   │   ├── game_state.gd        # Autoload session, paramètres, checkpoints
│   │   ├── save_store.gd        # JSON atomique, validation, copie de secours
│   │   ├── dialogue.gd          # Dialogue réutilisable, signaux et callback final
│   │   ├── interactable.gd      # Contrat de cible et rayon d'interaction
│   │   ├── interaction_scanner.gd # Proximité + ligne de vue, 12,5 Hz
│   │   ├── world_router.gd      # Registre extensible de mondes autorisés
│   │   └── audio.gd            # Autoload musique + pool de six lecteurs SFX
│   └── ui/
│       ├── ui_style.gd          # Thème partagé
│       ├── menu.gd              # Écrans de menus
│       ├── game_hud.gd          # Affichage/commandes, sans logique métier
│       ├── virtual_joystick.gd  # Axe analogique et suivi d'un doigt
│       └── touch_action.gd      # Boutons indépendants multi-touch
├── resources/
│   ├── dialogues.json
│   └── default_bus_layout.tres
├── assets/audio/                # Une boucle originale et sept effets WAV
├── tools/generate_audio.py
├── tests/                       # Scènes de tests métier, intégration et rendu natif
└── docs/
```

Les scènes sont légères : la géométrie est construite au chargement. L'éditeur montre donc surtout la hiérarchie avant exécution ; lancer la scène pour voir la ville et les personnages. Aucun plugin d'import 3D ni Blender requis.

## Flux de données

- `GameState` détient la session et les paramètres. `MissionProgress` est indépendante du SceneTree.
- La mission émet `changed` → `main.gd` synchronise monde/HUD et sauvegarde.
- Le scanner ne connaît pas les missions : il sélectionne une cible visible dans son rayon et émet `activated`.
- L'orchestrateur choisit le dialogue/effet, puis avance la mission **à la fin** du dialogue.
- `DialogueSystem` lit des données externes. Le HUD ne reçoit que nom et texte.
- La liste `unlocked` conserve le déblocage de `le_signal_de_patch`, sans charger un chapitre non livré.
- Les fragments ont des identifiants stables ; le compteur et l'inventaire sont reconstruits et validés lors du chargement.
- Les points de reprise sont explicites et sûrs : réveil, place, terminal. On ne restaure jamais une position au milieu d'un mur.
- `main.gd` traite la pause toujours ; personnages, monde et HUD sont pausable. Le menu et l'audio continuent pendant une pause.

## Extensions prévues, pas encore livrées

`WorldRouter` est un registre de scènes pour les futurs mondes. Une seule entrée est livrée. Le changement de monde animé/asynchrone n'est pas encore exposé dans le jeu. L'inventaire est actuellement un dictionnaire métier dans la mission ; une interface d'inventaire générale, un catalogue d'items et un gestionnaire multi-missions seront à ajouter lors du second chapitre. Aucune fausse scène des autres royaumes.

## Optimisation

Décors statiques : primitives unitaires partagées, regroupées par mesh et matériau en MultiMesh. Les corps de collision restent séparés. Personnages/portes/objets animés ne sont pas regroupés. Aucune lumière ponctuelle, aucun effet de glow écran requis : les surfaces lumineuses utilisent des matériaux unshaded. Un soleil, ombres désactivées par défaut, distance caméra 110 m. Le mode économie limite à 30 FPS ; le mode normal limite à 60 FPS et active les ombres (1024).

Le budget réel GPU, le temps de chargement, la chauffe et la consommation doivent être mesurés sur téléphone. MultiMesh réduit les draw calls mais ne prouve pas à lui seul la cible de 30 FPS.
