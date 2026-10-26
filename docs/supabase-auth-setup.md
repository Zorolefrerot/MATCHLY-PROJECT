# Authentification et données multi-boutiques

## État

Trois migrations ont été appliquées au projet Supabase `sgiyuxpzqyyquvvznomn` :

- `shopflow_accounts_multishop` — profils, comptes d’abonnement, boutiques, membres, enregistrements tenant-isolés, RLS et fonction serveur de création de boutique.
- `business_multishop_no_assumed_cap` — Business autorise plusieurs boutiques sans plafond numérique inventé; Starter et Pro restent mono-boutique.
- `shopflow_import_assets` — bucket privé par boutique et import transactionnel non-écrasant.

Les tables portent le préfixe `shopflow_` et n’altèrent pas `shopflow_catalogs` ni son bucket public. Les politiques RLS isolent les profils/abonnements par propriétaire et les enregistrements/photos de boutique par appartenance. `shopflow_create_shop` contrôle côté serveur le forfait, l’état d’essai et la création; l’essai de sept jours commence à la création de la première boutique.

L’interface propose maintenant l’inscription sociale Google, GitHub et Facebook; les formulaires d’inscription e-mail/mot de passe ont été retirés. Le compte peut se connecter avec l’un de ces fournisseurs lorsqu’il est configuré. La connexion e-mail/mot de passe reste disponible uniquement pour les comptes existants. La liste/sélection des boutiques, la création de boutique, la session et la récupération des mots de passe existants passent par Supabase. L’interface Auth reste désactivée tant que le client Supabase n’est pas configuré. La migration locale propose un aperçu et un clic de confirmation; elle copie une sauvegarde dédiée au compte, conserve la clé locale `shopflow_rdc_mockup_v4`, importe les lignes dans une boutique cloud vide et téléverse les photos dans le bucket privé. L’import n’écrase jamais une boutique qui contient déjà des enregistrements.

Après import, les modifications ultérieures restent locales jusqu’à la mise en place de la synchronisation continue et de sa résolution des conflits. Les secrets catalogue et le PIN patron ne sont pas inclus dans l’instantané cloud.

## Configuration requise avant un test réel d’inscription

L’URL de site Supabase et la liste de redirections ont été réglées pour le domaine Render confirmé `shopflow-drc.onrender.com` et le chemin `/app/`. Google, GitHub et Facebook OAuth restent désactivés, et la clé publishable n’est pas encore renseignée dans Render. Les boutons sociaux sont visibles, mais restent désactivés jusqu’à la configuration de la clé et de chaque fournisseur. Aucun SMTP personnalisé n’est configuré; il ne bloque pas OAuth, mais reste nécessaire pour les e-mails de récupération des anciens comptes e-mail.

1. Copier `shopflow/.env.example` dans `shopflow/.env.local` pour le développement. Le blueprint Render définit déjà `VITE_SUPABASE_URL` et la redirection vers `/app/`; il laisse `VITE_SUPABASE_PUBLISHABLE_KEY` à renseigner dans Render. Cette clé publishable est nécessaire à tous les parcours Auth et publique par conception et protégée par les politiques RLS. Les secrets `SUPABASE_SECRET_KEY`, SMTP et OAuth ne doivent jamais être mis dans une variable `VITE_`.
2. Le site public confirmé est `https://shopflow-drc.onrender.com`; le blueprint Render utilise `https://shopflow-drc.onrender.com/app/` pour les retours Auth.
3. Dans Supabase **Authentication → URL Configuration**, l’URL du site est `https://shopflow-drc.onrender.com` et les redirections autorisées sont `https://shopflow-drc.onrender.com/app/` et `https://shopflow-drc.onrender.com/app/**`. Le réglage est déjà appliqué au projet.
4. SMTP est facultatif pour l’inscription sociale. Si tu conserves la connexion e-mail des anciens comptes et la récupération de mot de passe, configure un SMTP transactionnel dans Supabase **Authentication → SMTP Settings** avec les paramètres fournis par le service (hôte, port/TLS, utilisateur, mot de passe SMTP, adresse et nom d’expéditeur). Utilise un domaine d’expédition vérifié. Ne partage ni ne commite les identifiants.
5. Les boutons Google, GitHub et Facebook sont visibles, mais inactifs tant que le fournisseur correspondant n’est pas configuré. Pour chacun, créer une application OAuth chez le fournisseur et utiliser cette callback Supabase : `https://sgiyuxpzqyyquvvznomn.supabase.co/auth/v1/callback`. Dans Supabase **Authentication → Sign In / Providers**, activer le fournisseur puis saisir son client ID et son secret. Dans Render, passer uniquement le drapeau correspondant (`VITE_SHOPFLOW_GOOGLE_OAUTH_ENABLED`, `VITE_SHOPFLOW_GITHUB_OAUTH_ENABLED` ou `VITE_SHOPFLOW_FACEBOOK_OAUTH_ENABLED`) à `true`, puis redéployer. Ne pas partager les secrets OAuth dans le dépôt ou le chat.
6. Après configuration, tester l’inscription et la connexion via chaque fournisseur activé, la création/sélection de boutique et l’import avec un compte de test. Tester aussi l’envoi d’e-mail de récupération si la connexion e-mail des anciens comptes est conservée. Vérifier aussi l’isolation RLS avec deux utilisateurs indépendants avant le déploiement public.

## Comptes et sauvegardes

Supabase Auth persiste les identités dans `auth.users`; un trigger crée automatiquement une ligne `shopflow_profiles` au moment de l’inscription. Les plans/essais, boutiques, membres et données métier sont persistés séparément dans les tables `shopflow_…`. Les mots de passe sont gérés et hachés par Supabase Auth, jamais stockés en clair par ShopFlow.

Cela assure le stockage applicatif, mais ne constitue pas en soi une stratégie de sauvegarde restaurable. Aucune exportation planifiée hors site ni répétition de restauration n’est configurée par le code. Dans le tableau de bord Supabase, vérifier les sauvegardes et leur rétention selon le forfait du projet; prévoir au besoin une copie chiffrée, à accès restreint, de la base **et** des objets Storage, puis tester la restauration dans un environnement séparé. Ne pas exporter les mots de passe en clair ni déposer de dumps dans Git.
