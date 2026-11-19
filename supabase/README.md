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

## Mode test temporaire sans paiement obligatoire

L’interface reste en accès test sans expiration et sans paiement; aucun statut payé n’est créé par le navigateur. Pour la synchronisation multi-appareils, la migration additive `20261119233521_shopflow_realtime_delta.sql` ajoute uniquement la fonction de synchronisation par changements et inscrit `shopflow_records` à la publication Realtime. Elle ne modifie ni les comptes, boutiques ou données existantes. La migration `shopflow_testing_access.sql` n’est pas appliquée automatiquement. Aucun paramètre de prestataire de paiement n’est requis.

## Paiements d’abonnement

Aucun prestataire de paiement n’est intégré actuellement. Les formules affichées sont informatives; aucun checkout ni activation payante n’est disponible. Le choix du prochain prestataire sera confirmé avant toute intégration. Les clés et les données Supabase, les profils, boutiques, membres et données vendeurs ne sont pas modifiés par ce retrait. Aucun objet SQL ni enregistrement distant n’est supprimé.

## Comptes et boutiques

Le projet Supabase ShopFlow conserve ses profils, abonnements, boutiques, membres, enregistrements, photos et règles RLS. `shopflow_create_shop` contrôle les droits côté serveur : Starter/Pro restent mono-boutique, Business autorise plusieurs boutiques, sans plafond numérique inventé. Les tables du catalogue public restent distinctes.

Les réglages, articles, ventes, crédits et dépenses sont synchronisés par changements de lignes (`shopflow_apply_shop_changes`) : ajouts, modifications et suppressions logiques (`deleted_at`). Les appareils connectés à la même boutique écoutent Realtime sur `shopflow_records`; un rafraîchissement de secours reprend les changements à la reconnexion et au retour au premier plan. Le client fusionne les changements locaux en attente avec les données reçues et n’écrase pas les autres lignes de la boutique; la copie locale reste disponible hors ligne. Une sauvegarde cloud n’est confirmée que lorsque l’état indique la synchronisation réussie; en cas d’échec, la copie locale est conservée et les tentatives reprennent automatiquement. Consulter `docs/supabase-auth-setup.md` pour les prérequis du domaine, SMTP, OAuth et les tests à effectuer. Les clés privées restent uniquement côté serveur; le navigateur reçoit seulement une clé publishable.
