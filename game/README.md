# IDREM ZENKAI — Prototype d’entraînement Android

Prototype **solo et hors ligne**, séparé du site Render/Neon. Godot **4.5.1 Standard**, GDScript, rendu Compatibility/OpenGL ES 3. Les personnages et décors sont des formes procédurales originales, pas les modèles définitifs du jeu Naruto.

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

Cible initiale : Android **8+**, CPU ARM64 ou ARMv7, OpenGL ES 3, orientation paysage. La compatibilité et les performances réelles doivent être vérifiées sur les téléphones des testeurs. Aucun accès Internet, localisation, caméra, micro ou contacts n’est demandé par le projet.

La compilation GitHub vérifie la signature de l’APK et ses permissions. Une compilation réussie n’équivaut pas à un essai sur un téléphone physique.

### Activation initiale — permission GitHub nécessaire

**Le workflow est fourni comme modèle dans [`ci/android-prototype.yml`](ci/android-prototype.yml), pas encore activé.** La connexion GitHub d’Arena a refusé la création de `.github/workflows/android-prototype.yml` faute de permission `workflows`. Il n’existe donc pas encore de compilation ni d’APK à télécharger. Cela ne concerne pas ton site Render qui continue de fonctionner.

Deux solutions, sans partager de mot de passe ni de jeton : reconnecter GitHub dans Arena avec la permission de gérer les workflows si proposée, ou créer toi-même le fichier depuis le site GitHub :

1. Sélectionner **`arena/01a08158-matchly-project`** dans le sélecteur de branche du dépôt (pas `main`).
2. Ouvrir `game/ci/android-prototype.yml`, afficher **Raw**, puis copier tout son contenu.
3. Revenir à la racine du dépôt, **Add file → Create new file**. Sur téléphone, le mode « site pour ordinateur » du navigateur peut faciliter cette opération.
4. Nommer le fichier **`.github/workflows/android-prototype.yml`** et coller le contenu.
5. Choisir un commit directement sur **`arena/01a08158-matchly-project`**. La première compilation doit démarrer automatiquement grâce au déclencheur `push`.
6. Si GitHub affiche une erreur, ne pas supposer que l’APK existe : transmettre le texte de l’erreur, sans secret.

Le modèle inclut `workflow_dispatch`, mais le bouton manuel peut ne pas apparaître tant que le workflow n’est pas sur la branche par défaut. Le premier commit du fichier est le déclencheur prévu.

### Récupérer une compilation depuis GitHub, une fois verte

1. Ouvrir le dépôt `Zorolefrerot/MATCHLY-PROJECT` dans GitHub, puis **Actions**.
2. Choisir **Android - Prototype IDREM ZENKAI** et une exécution **verte**, correspondant au dernier commit de `arena/01a08158-matchly-project`.
3. Dans **Artifacts**, télécharger `idrem-zenkai-android-…` (connexion à GitHub nécessaire).
4. Extraire le ZIP sur le téléphone et ouvrir `idrem-zenkai-training-debug.apk`.
5. Si Android demande une autorisation d’installation depuis le navigateur/gestionnaire de fichiers, ne l’accorder qu’à cette application de confiance et la retirer après installation. Ne pas désactiver les protections globales du téléphone.
6. Garder les graphismes **Économie** pour le premier essai.

L’APK est signé avec une **clé de test temporaire**, pas une clé Play Store. Une nouvelle exécution peut générer une signature différente : Android pourra demander de désinstaller le prototype précédent avant installation. Le paquet `org.idremzenkai.training` est distinct du futur jeu. Aucun compte ni candidature n’est supprimé en désinstallant ce prototype.

Les artefacts expirent après **7 jours**. Le workflow se lance uniquement lors d’un changement de `game/` ou de son propre fichier sur notre branche, pas lors des changements du site. Il utilise un runner GitHub standard et aucun secret de Render ou Neon. Le dépôt est public au moment de la préparation ; vérifier les conditions et quotas GitHub si sa visibilité change. Aucun runner premium ni abonnement n’est configuré.

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

Le script d’export crée des paramètres Godot dans le dossier de configuration de **l’utilisateur de compilation**. En local, utiliser un utilisateur/dossier XDG dédié pour ne pas remplacer ses paramètres d’éditeur personnels. Aucun SDK NDK ni compilation de moteur n’est requis ici : le projet utilise les modèles APK standards, sans Gradle ni plugin natif.

- `tests/smoke.gd` : règles, collisions, mouvement, sauts, esquive, pause, cible, projectile, victoire et réinitialisation.
- `tests/capture.gd` : captures de rendu ordinateur, pas des preuves d’exécution Android.
- Les logs disponibles sont conservés dans les artefacts GitHub même si une étape échoue. Les captures ne sont produites qu’après les tests et l’export réussis.

## Essai à réaliser par le propriétaire

Noter le modèle du téléphone et la version Android. Vérifier : installation, lancement, joystick + technique en même temps, caméra, saut, collisions des murs, chakra et recharges, esquive du cercle rouge, pause/reprise après changement d’application, victoire/défaite et rejouer. Observer les FPS en Économie, puis Standard ; signaler chauffe, chute de fluidité ou fermeture inattendue.

## Ce qui vient après

Corriger les retours de prise en main/performance, préparer des vrais modèles et animations sous licences appropriées, puis seulement tester la synchronisation de **deux joueurs** et une mission coopérative. L’authentification, les permissions et les récompenses du vrai jeu devront rester contrôlées par un serveur autoritaire ; ce prototype local ne doit pas être connecté tel quel aux récompenses de production.

## Ressources et licences

Godot : licence MIT (<https://godotengine.org/license/>). Personnages et décor : géométrie originale créée pour ce prototype. Icône : image fournie dans le dépôt par le propriétaire ; les droits sur l’univers et l’illustration restent à vérifier avant diffusion publique. Aucun modèle, musique ou animation extrait d’un jeu commercial n’a été ajouté.
