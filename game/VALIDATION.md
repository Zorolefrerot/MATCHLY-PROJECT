# Validation du prototype — 10 septembre 2026

## Résultats obtenus

| Vérification | Résultat réel |
|---|---|
| Tests Node du site + isolation du prototype | 15/15 passent |
| Construction Vite du site | Réussie, 1 597 modules |
| Analyse GDScript statique | Pas de diagnostic avec les réglages du projet |
| Exécution Godot de `tests/smoke.gd` | **47 assertions passent**, code de sortie 0, `IDREM_SMOKE_FAILURES=0` |
| Erreurs dans le journal de la simulation | Aucune `SCRIPT ERROR`, `ERROR` ou assertion échouée |
| Import dans l’éditeur officiel complet (CI) | Réussi, contrôle strict passé |
| Import dans l’ancien éditeur local réduit | Erreurs d’environnement `fontconfig`, historique ci-dessous |
| Rendu GL / captures | Étape CI réussie : captures ordinateur produites sous Xvfb/Mesa, pas un test Android |
| Export APK / signature / permissions finales | **Réussis** : signature debug vérifiée avec `apksigner`, contrôle `aapt` sans permission réseau/sensible interdite |
| Téléphone Android physique | **Non testé** |
| Workflow GitHub Actions | Activé par le propriétaire ; exécution **34440928876 verte** |

Ne pas interpréter les tests sans affichage comme une validation du rendu ou des performances Android. L’APK est disponible en artefact GitHub, mais n’a pas encore été installée ni testée sur le téléphone du propriétaire. Les captures n’ont pas été inspectées visuellement dans Arena : l’accès aux hôtes de téléchargement des artefacts y est bloqué.

## Première compilation Android réussie

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

Aucun appel à Render/Neon, aucune modification des comptes/candidatures/clans, aucun SDK installé sur Render et aucune migration de la vraie base. Les tests du site utilisent leurs données de test isolées. Le paquet Android prévu est distinct : `org.idremzenkai.training`.
