# ShopFlow

Site vitrine statique et application ShopFlow réunis dans un dépôt, prêts à être compilés pour Vercel.

## Déployer sur Vercel

1. Importer ce dépôt dans Vercel.
2. Garder le **Root Directory** à la racine du dépôt.
3. Vercel lit `vercel.json` : l’installation npm, la compilation et le dossier de sortie `dist/` sont configurés.
4. Lancer le déploiement. La vitrine sera à la racine et l’application web/PWA dans `/app/`.

Commandes équivalentes pour vérifier le build localement :

```bash
npm --prefix shopflow ci
npm run build
```

## Installer la PWA sur iPhone

Après déploiement en HTTPS, ouvrir directement `https://<domaine-vercel>/app/` dans Safari, puis **Partager → Ajouter à l’écran d’accueil**. Cette version web installable ne requiert pas d’adhésion Apple Developer et n’est pas une IPA/App Store.

La PWA conserve ses données localement sur l’appareil. Elle ne synchronise pas automatiquement avec une installation Android.

## APK Android

Le workflow **ShopFlow Android APK** compile un APK de test et maintient une préversion GitHub pour son téléchargement. L’APK est signé en mode debug et destiné aux essais, pas à une distribution commerciale.
