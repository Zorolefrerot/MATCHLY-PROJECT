# ShopFlow

Vitrine statique et application ShopFlow réunies dans un dépôt. Le build produit le site vitrine à la racine et l’application web installable (PWA) à `/app/`.

## Héberger sur Render

Un Blueprint Render est fourni dans `render.yaml`.

1. Ouvrir [dashboard.render.com](https://dashboard.render.com/) et connecter le compte GitHub qui a accès à ce dépôt.
2. Choisir **New + → Blueprint** et importer `Zorolefrerot/MATCHLY-PROJECT`.
3. Vérifier que Render sélectionne la branche `arena/0b9f89cc-matchly-project` et que le service est de type **Static Site** (`runtime: static`).
4. Confirmer la création du Blueprint et attendre le build. Render exécute les commandes définies dans `render.yaml` et publie `dist/`.

Si tu crées le service manuellement au lieu d’utiliser le Blueprint :

- **Type :** Static Site
- **Branch :** `arena/0b9f89cc-matchly-project`
- **Root Directory :** laisser vide (racine du dépôt)
- **Build Command :** `npm --prefix shopflow ci && npm run build:hosted`
- **Publish Directory :** `dist`

La compilation télécharge l’APK de test depuis la préversion GitHub et l’inclut dans `/downloads/ShopFlow-Android.apk`, pour que le bouton du site lance un téléchargement depuis le domaine Render.

Aucune variable d’environnement n’est nécessaire pour le build statique.

## Installer la PWA sur iPhone

Après déploiement, ouvrir `https://<adresse-render>/app/` dans Safari, puis choisir **Partager → Ajouter à l’écran d’accueil**. La version web installable ne requiert pas d’adhésion Apple Developer et n’est pas une IPA/App Store.

Les données sont conservées localement sur chaque appareil et ne sont pas synchronisées automatiquement entre la PWA iPhone et Android.

## APK Android

Le workflow **ShopFlow Android APK** compile un APK de test et maintient une préversion GitHub pour son téléchargement. L’APK est signé en mode debug et destiné aux essais, pas à une distribution commerciale.
