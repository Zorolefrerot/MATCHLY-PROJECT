# Catalogue ShopFlow en direct (Supabase)

Le catalogue public utilise un identifiant UUID stable (`?catalog=<uuid>`). Les visiteurs lisent le catalogue courant à l’ouverture; l’application met à jour la même ligne après chaque changement de paramètres publics, prix ou stock. Une demande client est encodée dans le fragment d’un lien partageable (`#order=…`) : elle n’est pas enregistrée sur le serveur et ne crée aucune vente. Toute personne possédant ce lien peut toutefois consulter les coordonnées et la sélection; l’acheteur doit le transmettre uniquement à la boutique.

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

## Comptes et boutiques

Le schéma multi-boutique initial est dans `supabase/20261026_shop_accounts.sql`; le bucket privé par boutique et l’import transactionnel non-écrasant sont définis dans `supabase/20261026_shop_import_assets.sql`. Ces migrations sont déjà appliquées au projet ShopFlow. RLS couvre profils, abonnements, boutiques, membres, enregistrements et photos. `shopflow_create_shop` contrôle le forfait côté serveur : Starter/Pro restent mono-boutique, Business autorise plusieurs boutiques, sans plafond numérique inventé. Les tables du catalogue public restent distinctes.

Les écrans d’authentification, de sélection de boutique et d’import sont raccordés au SDK Supabase; ils restent désactivés dans tout build sans configuration publique. La synchronisation continue après import n’est pas encore activée. Consulter `docs/supabase-auth-setup.md` pour les prérequis du domaine, SMTP, Google OAuth et les tests à effectuer. Les clés privées restent uniquement côté serveur; le navigateur reçoit seulement une clé publishable.
