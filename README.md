# ShopFlow

Vitrine ShopFlow et application installable réunies dans un dépôt. Le build produit la vitrine à la racine, le film animé indépendant à `/motion/`, les tutoriels illustratifs à `/tutoriels/` et la PWA distincte à `/app/`. La création d’une boutique se fait dans l’application, pas sur la vitrine.

## Héberger sur Render

Un Blueprint Render est fourni dans `render.yaml`.

1. Ouvrir [dashboard.render.com](https://dashboard.render.com/) et connecter le compte GitHub qui a accès à ce dépôt.
2. Choisir **New + → Blueprint** et importer `Zorolefrerot/MATCHLY-PROJECT`.
3. Vérifier le service web Node défini par `render.yaml`; il sert la vitrine, la PWA et les routes API nécessaires à la synchronisation et aux intégrations serveur.
4. Confirmer la création du Blueprint et attendre le build. Render exécute les commandes définies dans `render.yaml` et publie `dist/`.

Si tu crées le service manuellement au lieu d’utiliser le Blueprint :

- **Type :** Web Service (Node)
- **Root Directory :** laisser vide (racine du dépôt)
- **Build Command :** `npm --prefix shopflow ci && npm run build`
- **Start Command :** `npm start`

La compilation télécharge l’APK de test depuis la préversion GitHub et l’inclut dans `/downloads/ShopFlow-Android.apk`, pour que le bouton du site lance un téléchargement depuis le domaine Render.

Les variables de service et de build sont définies dans `render.yaml`; les clés privées restent côté serveur. L’accès test ne demande ni échéance ni paiement; aucun prestataire de paiement n’est intégré pour le moment.

## Installer la PWA sur iPhone

Après déploiement, ouvrir `https://<adresse-render>/app/` dans Safari, puis choisir **Partager → Ajouter à l’écran d’accueil**. La version web installable ne requiert pas d’adhésion Apple Developer et n’est pas une IPA/App Store.

Avec le même compte connecté, les données de boutique synchronisées dans Supabase sont accessibles sur les autres appareils. La copie locale sert à l’accès hors connexion; une sauvegarde exportée reste une copie distincte et doit être conservée séparément.

## APK Android

Le workflow **ShopFlow Android APK** compile un APK de test, vérifie sa signature et maintient une préversion GitHub. Le package de test Android est `cd.shopflow.app.test`, afin de ne pas remplacer une autre installation ShopFlow. La clé de débogage stable est réservée aux mises à jour de test et ne doit pas signer une version de production.
