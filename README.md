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

Les routes `/downloads/ShopFlow-Android.apk` et `/downloads/ShopFlow-Windows.exe` redirigent vers les fichiers vérifiés de la préversion GitHub; les binaires ne sont pas copiés dans le dépôt ni dans `dist/`.

Les variables de service et de build sont définies dans `render.yaml`; les clés privées restent côté serveur. L’accès test ne demande ni échéance ni paiement; aucun prestataire de paiement n’est intégré pour le moment.

## Installer la PWA sur iPhone

Après déploiement, ouvrir `https://<adresse-render>/app/` dans Safari, puis choisir **Partager → Ajouter à l’écran d’accueil**. La version web installable ne requiert pas d’adhésion Apple Developer et n’est pas une IPA/App Store.

Avec le même compte connecté, les données de boutique synchronisées dans Supabase sont accessibles sur les autres appareils. La copie locale sert à l’accès hors connexion; une sauvegarde exportée reste une copie distincte et doit être conservée séparément.

## APK Android

Le workflow **ShopFlow test installers** compile l’APK Android avec la clé de test stable, vérifie son package et sa signature, et produit l’installateur Windows x64. Les fichiers sont publiés ensemble dans une préversion GitHub; le site redirige vers cette release. Le package Android de test est `cd.shopflow.app.test`, afin de coexister avec une installation de production.

## Application Windows

L’application Windows est un installateur Electron x64 qui ouvre ShopFlow depuis le domaine officiel et conserve une session locale persistante. La première ouverture demande une connexion Internet; après chargement, la PWA peut utiliser ses capacités hors connexion. L’installateur n’est pas signé par certificat Windows et SmartScreen peut afficher un avertissement. Le fichier `.exe` n’est pas une application Microsoft Store.
