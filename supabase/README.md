# Catalogue ShopFlow en direct (Supabase)

Le catalogue public utilise un identifiant UUID stable (`?catalog=<uuid>`). Les visiteurs lisent le catalogue courant à l’ouverture; l’application met à jour la même ligne après chaque changement de paramètres publics, prix ou stock. Les demandes des visiteurs restent des brouillons WhatsApp et ne créent aucune vente.

## Mise en service

1. Créez un projet Supabase et ouvrez **SQL Editor**.
2. Exécutez le contenu de `supabase/catalog.sql`. Si vous avez déjà créé la table, réexécutez le fichier complet : il ajoute aussi le bucket public `shopflow-catalog-images` nécessaire aux photos, sans supprimer les catalogues existants.
3. Dans les variables d’environnement **serveur** du service Render ou du projet Vercel, définissez :
   - `SUPABASE_URL` : URL HTTPS du projet Supabase.
   - `SUPABASE_SECRET_KEY` : **Secret API key** du projet (commence par `sb_secret_`). Si votre projet n’a que les anciennes clés, `SUPABASE_SERVICE_ROLE_KEY` reste accepté temporairement; privilégiez la nouvelle clé.
4. Ne définissez jamais ces secrets sous une variable `VITE_*`, ne les ajoutez pas au dépôt et ne les collez pas dans l’application. Redéployez le service après configuration.
5. Vérifiez `GET /api/health` : `catalogConfigured`, `catalogDatabaseReady` et `catalogImagesReady` doivent tous être `true`. Si l’un est `false`, les champs `catalogDatabaseStatus`/`catalogDatabaseErrorCode` et `catalogImagesStatus`/`catalogImagesErrorCode` donnent un diagnostic sans révéler de secret.
6. Dans ShopFlow, ouvrez **Catalogue en ligne** et créez le lien stable. Vérifiez une première fois le lien public, puis modifiez le prix ou le stock : le même URL doit afficher la nouvelle valeur après rechargement.

Les photos de produits importées depuis le téléphone sont compressées puis téléversées dans le bucket public `shopflow-catalog-images`; le catalogue contient leur URL publique. N’y placez pas de photos privées ou sensibles. L’application conserve localement un UUID et un jeton aléatoire d’écriture propre à la boutique. Seule son empreinte SHA-256 est stockée dans Supabase; le jeton n’est jamais envoyé aux visiteurs. Si les données locales de l’application sont effacées, l’accès d’écriture à ce lien ne peut pas être récupéré : créez un nouveau lien.

Pour un APK/PWA construit avec une API hébergée sur un autre domaine, configurez `VITE_CATALOG_API_URL` à l’URL HTTPS de cette API lors du build. Par défaut, le navigateur utilise son origine actuelle et les versions natives utilisent `https://shopflow.cd`.
