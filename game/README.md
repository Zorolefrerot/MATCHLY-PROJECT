# IDREM ZENKAI — Prototype d’entraînement Android

Prototype **solo et hors ligne**, séparé du site Render/Neon. Godot **4.5.1 Standard**, GDScript, rendu Compatibility/OpenGL ES 3. Les personnages et décors sont des formes procédurales originales, pas les modèles définitifs du jeu Naruto.

## État vérifié

**Version 0.4.0 compilée et vérifiée le 10 septembre 2026.** Les **90 assertions Godot**, l’export signé de test, le contrôle des permissions et les captures de rendu ordinateur ont réussi. Les captures de Katon et Raiton ont également été inspectées dans Arena. Le propriétaire avait apprécié la fluidité de 0.1.0 ; les performances de 0.4.0 sur téléphone restent à confirmer. Détails : [`VALIDATION.md`](VALIDATION.md).

- [Télécharger le ZIP `idrem-zenkai-android-9` (environ 63 Mo)](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323/artifacts/10141009252) — connexion GitHub nécessaire, disponible jusqu’au **17 septembre 2026**.
- [Exécution verte et fichiers](https://github.com/Zorolefrerot/MATCHLY-PROJECT/actions/runs/34449560323).
- Extraire le ZIP et ouvrir **`idrem-zenkai-training-debug.apk`**. Ne pas télécharger `godot-test-logs-9` à la place.

## Nouveautés 0.4.0 — feu et foudre uniquement

- **Katon** : boule de feu à silhouette plus large, flammes orange/jaune animées, cœur clair, courte traînée de flammes et embrasement à l’impact. La sphère opaque provisoire a été retirée.
- **Raiton** : cœur blanc, canal cyan et halo bleu ; branches et arcs autour de la main et du point atteint, trois formes successives puis disparition rapide.
- Texture de feu originale et partagée ; éclair regroupé en trois maillages. Pas de lumière dynamique, d’effet plein écran ou de secousse de caméra ; plafond des groupes secondaires conservé à 14.
- **Sons fournis, warning, règles de combat, Fūton et Doton inchangés.** Aucune modification du site ni des comptes.
- Cette mise à jour termine les retouches demandées pour l’étape d’entraînement, sans ouvrir un nouveau chantier de jeu. Affichage de version : **PROTO 0.4**.

Détails et génération reproductible : [`assets/vfx/README.md`](assets/vfx/README.md).

## Enregistrements de la version 0.3.0 conservés

- Les **neuf fichiers fournis** dans le dépôt remplacent les sons provisoires : Katon, Raiton, Fūton, Doton, impact de terre, frappe, coup reçu, esquive et musique de combat.
- Signal **warning original** conservé par l’agent : 0,12 s, légèrement mis en avant pour annoncer l’attaque ennemie.
- Volumes harmonisés, suppression des silences extérieurs et fondus courts. La durée audible des enregistrements est conservée, sans changement de hauteur. La musique préparée dure environ **41,51 secondes** et boucle en arrière-plan.
- Un effet identique déjà en cours est redémarré à la nouvelle action : les enregistrements longs ne s’empilent pas à chaque frappe. Les techniques gardent leurs coûts, dégâts et recharges.
- Les fichiers **melee** et **dodge** fournis sont identiques ; ces deux associations sont conservées.
- Sources exactes préservées dans `game/audio_sources/`, hors de l’APK. Malgré leur extension `.mp3`, il s’agit d’AAC/MP4 : ils ont été réellement décodés en WAV, pas seulement renommés.

Détails, empreintes et conversion reproductible : [`assets/audio/README.md`](assets/audio/README.md). Les droits des enregistrements fournis n’ont pas été vérifiés ; ils ne sont pas revendiqués comme des créations originales de l’agent.

## Améliorations de la version 0.2.0 conservées

- **Logo retiré de l’interface de combat** : aucun `TextureRect` ni image de logo ne peut couvrir la vue. L’icône Android est conservée.
- **Course ninja** : bras en arrière, légère inclinaison du personnage, transitions vers l’arrêt ; le bras de frappe revient vers l’avant même en course. Pose visuelle uniquement, sans modification des dégâts ni des vitesses.
- **Effets plus lisibles** : traînée et étincelles de feu, éclair en zigzag, anneaux de vent, pierres surgissant du sol, arc de frappe et impacts. Effets 3D courts, sans flash plein écran ni secousse de caméra, maximum 14 groupes simultanés ; densité réduite en Économie.
- **Lecture audio hors ligne** : effets par action, avertissement et ambiance. Les sons provisoires originaux de 0.2.0 sont remplacés par les enregistrements fournis dans 0.3.0, sauf le warning.
- **Pause → Volume général** (0 = silence) et **Ambiance de combat** (activation indépendante). Limiteur contre la saturation, 8 voix d’effets maximum, une seule piste de fond ; silence à l’accueil, en pause et au résultat. Réglages conservés pour la session, pas après fermeture.

La lecture audio est couverte par les tests du moteur, mais son rendu sur les haut-parleurs du téléphone et l’impact des nouveaux effets sur les FPS restent à confirmer par le propriétaire.

## Contenu

- Petite arène 3D fermée avec collisions, décor de village stylisé et personnages articulés provisoires.
- Déplacements relatifs à la caméra, course, saut et esquive avec courte protection.
- Joystick tactile à gauche ; glissement à droite pour orienter la caméra ; plusieurs doigts peuvent déplacer, viser et lancer des techniques simultanément.
- Verrouillage optionnel de l’adversaire. DOTON reste une zone visée manuellement au sol.
- Quatre techniques de test : KATON (projectile), RAITON (rayon), FŪTON (cône et recul), DOTON (onde de zone après avertissement).
- Chakra, régénération automatique ralentie en combat et recharges indépendantes.
- Adversaire à logique programmée : patrouille, poursuite, cercle rouge de préparation, frappe. Peut être désactivé depuis la pause.
- Écrans d’accueil, pause, victoire/défaite, relance de manche et deux réglages graphiques.

**Ce n’est pas encore le jeu RP multijoueur.** Aucun compte du site n’est utilisé. Aucun clan, rang, inventaire, tirage ou récompense n’est sauvegardé. Le mélange de quatre éléments sert seulement à tester les mécaniques. Il ne remplace pas les règles d’affinité validées pour le jeu final.

## Téléphone Android

Cible de test conseillée : Android **8+**, CPU ARM64 ou ARMv7, OpenGL ES 3, orientation paysage. Le manifeste compilé fixe le minimum technique à Android **7 (API 24)** et cible Android **15 (API 35)** ; ce sont les valeurs intégrées au modèle standard, pas des garanties de compatibilité matérielle. La compatibilité et les performances réelles doivent être vérifiées sur les téléphones des testeurs. Aucun accès Internet, localisation, caméra, micro ou contacts n’est demandé par le projet.

La compilation GitHub vérifie la signature de l’APK et ses permissions. Une compilation réussie n’équivaut pas à un essai sur un téléphone physique.

### Compilation activée — aucune nouvelle configuration nécessaire

Le propriétaire a ajouté `.github/workflows/android-prototype.yml` depuis GitHub sur **`arena/01a08158-matchly-project`**, commit `8af7056`. Le modèle reste dans [`ci/android-prototype.yml`](ci/android-prototype.yml). Il ne faut **pas recréer le fichier**.

La connexion Arena ne peut toujours pas modifier les workflows eux-mêmes, mais les changements du jeu sur cette branche déclenchent la compilation existante. Aucun réglage Render ou Neon n’est requis. Le bouton `Run workflow` peut rester absent tant que le workflow n’est pas sur la branche par défaut ; une exécution existante peut être relancée avec **Re-run jobs**.

### Récupérer une compilation depuis GitHub, une fois verte

1. Ouvrir le dépôt `Zorolefrerot/MATCHLY-PROJECT` dans GitHub, puis **Actions**.
2. Choisir **Android - Prototype IDREM ZENKAI** et une exécution **verte** correspondant à la version du jeu souhaitée sur `arena/01a08158-matchly-project`. Une mise à jour de documentation seule peut ne pas créer de nouvelle APK.
3. Dans **Artifacts**, télécharger `idrem-zenkai-android-…` (connexion à GitHub nécessaire).
4. Extraire le ZIP sur le téléphone et ouvrir `idrem-zenkai-training-debug.apk`.
5. Les clés de test changent entre compilations : **désinstaller l’ancien prototype avant d’installer la version 0.4.0** si Android refuse la mise à jour. Cela ne supprime aucun compte du site. Si Android demande une autorisation d’installation depuis le navigateur/gestionnaire de fichiers, ne l’accorder qu’à cette application de confiance et la retirer après installation. Ne pas désactiver les protections globales du téléphone.
6. Garder les graphismes **Économie** pour le premier essai.

L’APK est signé avec une **clé de test temporaire**, pas une clé Play Store. Une nouvelle exécution peut générer une signature différente : Android pourra demander de désinstaller le prototype précédent avant installation. Le paquet `org.idremzenkai.training` est distinct du futur jeu. Aucun compte ni candidature n’est supprimé en désinstallant ce prototype.

Les artefacts expirent après **7 jours**. Le workflow se lance uniquement lors d’un changement de `game/` ou de son propre fichier sur notre branche, pas lors des changements du site. Il utilise un runner GitHub standard et aucun secret de Render ou Neon. Le dépôt est public au moment de la préparation ; vérifier les conditions et quotas GitHub si sa visibilité change. Aucun runner premium ni abonnement n’est configuré.

**Limites gratuites vérifiées dans la [documentation GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)** : l’exécution sur runners standards est gratuite pour les dépôts publics. GitHub Free annonce notamment **500 Mo d’artefacts partagés avec Packages** ; pour les dépôts privés, **2 000 minutes/mois** sont incluses. Le stockage et les règles peuvent évoluer : surveiller **Settings → Billing and licensing** du compte, télécharger les APK utiles puis supprimer les anciens artefacts, et ne pas activer de dépassement payant. Si un moyen de paiement existe déjà sur le compte, vérifier le budget avec blocage des dépassements ; le projet ne modifie pas ces paramètres. Sans moyen de paiement valide, GitHub indique bloquer l’usage concerné après épuisement du quota. Les SDK/modèles volumineux ne sont pas conservés en artefacts.

Le bouton **Run workflow** peut ne pas apparaître tant que le workflow n’est pas dans la branche par défaut. Dans cette session nous travaillons uniquement sur `arena/01a08158-matchly-project` : utiliser une exécution déclenchée par un commit de cette branche, puis **Re-run jobs** si une nouvelle compilation identique est nécessaire. Ne pas changer de branche uniquement pour contourner cela.

## Sur ordinateur

Ouvrir `game/project.godot` avec Godot 4.5.1 Standard, puis F6/F5 pour lancer la scène/projet.

| Action | Commande |
|---|---|
| Déplacement | ZQSD / WASD / flèches |
| Caméra | Clic droit maintenu + glisser |
| Course | Maj |
| Saut | Espace |
| Esquive | Ctrl ou X |
| Frappe | F ou clic gauche hors interface |
| Techniques | 1, 2, 3, 4 |
| Cible | Tab |
| Pause | Échap |

Le bouton Retour Android ouvre la pause. Une perte de focus met le combat en pause et annule les entrées tactiles, pour ne pas laisser courir le personnage pendant une interruption.

## Compilation et tests

Godot et les modèles d’export officiels sont téléchargés par `tools/install_engine.sh`, puis vérifiés avec des SHA-256 fixés pour cette version. Ils ne sont ni ajoutés au dépôt ni installés sur Render.

```bash
# Depuis la racine du dépôt
export GODOT_BIN=/chemin/vers/godot
bash game/tools/check.sh
# JDK 17 + SDK Android API/build-tools 35 installés et variables configurées :
export JAVA_HOME=/chemin/vers/jdk17
export ANDROID_HOME=/chemin/vers/android-sdk
bash game/tools/export_android.sh
```

Le script d’export utilise automatiquement un dossier XDG temporaire dédié : il ne remplace pas les préférences personnelles de l’éditeur Godot. Aucun SDK NDK ni compilation de moteur n’est requis ici : le projet utilise les modèles APK standards, sans Gradle ni plugin natif. Les champs `gradle_build/min_sdk` et `target_sdk` doivent rester vides avec ces modèles standards. `rendering/textures/vram_compression/import_etc2_astc=true` est nécessaire pour préparer l’export mobile depuis Linux.

- `tests/smoke.gd` : règles, collisions, mouvement, sauts, esquive, pause, cible, projectile, victoire et réinitialisation.
- `tests/capture.gd` : captures de l’arène, de la course ninja, des quatre techniques et du menu ordinateur, pas des preuves d’exécution Android.
- `tools/prepare_audio.py` : conversion des neuf fichiers fournis (FFmpeg 7.x) avec manifeste des sources, durées et gains.
- `tools/generate_audio.py` : génération du **warning seulement** (Python standard). Ce script ne remplace plus les enregistrements fournis. Tests Node des empreintes, PCM, niveaux et raccord de boucle.
- Les logs disponibles sont conservés dans les artefacts GitHub même si une étape échoue. Les captures ne sont produites qu’après les tests et l’export réussis.

## Essai à réaliser par le propriétaire

Noter le modèle du téléphone et la version Android. Vérifier : installation, lancement, joystick + technique en même temps, caméra, saut, collisions des murs, chakra et recharges, esquive du cercle rouge, pause/reprise après changement d’application, victoire/défaite et rejouer. Observer les FPS en Économie, puis Standard ; signaler chauffe, chute de fluidité ou fermeture inattendue.

## Ce qui vient après

Corriger les retours de prise en main/performance, préparer des vrais modèles et animations sous licences appropriées, puis seulement tester la synchronisation de **deux joueurs** et une mission coopérative. L’authentification, les permissions et les récompenses du vrai jeu devront rester contrôlées par un serveur autoritaire ; ce prototype local ne doit pas être connecté tel quel aux récompenses de production.

## Ressources et licences

Godot : licence MIT (<https://godotengine.org/license/>). Les textes de licence du moteur et de ses composants sont inclus dans `THIRD_PARTY_NOTICES.txt`, également embarqué dans l’export. Personnages et décor : géométrie originale créée pour ce prototype. Icône : image fournie dans le dépôt par le propriétaire ; les droits sur l’univers et l’illustration restent à vérifier avant diffusion publique. Les modèles et animations restent procéduraux. Les enregistrements de la version 0.3.0 ont été fournis par le propriétaire ; leur provenance artistique et leurs droits sont à vérifier avant diffusion publique.
