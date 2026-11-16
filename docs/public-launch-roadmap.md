# Feuille de route — rendre ShopFlow opérationnel publiquement

Mise à jour : 6 novembre 2026. Ce document distingue les fonctions de démonstration des services réellement connectés.

## État constaté

- Le catalogue public et ses photos utilisent le projet Supabase existant. Le contrôle Render `/api/health` a récemment confirmé la base et le stockage d’images prêts.
- Supabase Auth est utilisé par l’application. L’URL de site et les redirections sont réglées pour `https://shopflow-drc.onrender.com` et `/app/`. L’inscription publique proposée est sociale uniquement : Google, GitHub ou Facebook; ces fournisseurs attendent encore leurs identifiants OAuth. Le formulaire e-mail/mot de passe d’inscription a été retiré; la connexion e-mail reste pour les comptes existants.
- Trois migrations Supabase créent le socle multi-boutique RLS, le bucket privé par boutique et l’import non-écrasant. Le catalogue public reste séparé. Voir `supabase/20261026_shop_accounts.sql`, `supabase/20261026_shop_import_assets.sql` et `docs/supabase-auth-setup.md`.
- Les écrans d’inscription/connexion appellent Supabase et gèrent la session, les boutons OAuth, la création/sélection de boutiques et la récupération des comptes existants. Google et GitHub sont confirmés opérationnels. Facebook reste désactivé pour le moment.
- L’import local avec aperçu et sauvegarde conservée est en place. La synchronisation continue des instantanés Supabase est confirmée; la copie locale demeure pour l’accès hors ligne et l’export/restauration.
- Le mode test sans échéance ni paiement obligatoire est présent dans l’interface. Il ne déclare aucun paiement et ne modifie pas les états de compte ou les données existantes. Aucune migration Supabase n’est exécutée pour ce déploiement.
- Le catalogue reste une fonction distincte : publier un catalogue ne crée pas un compte utilisateur et les demandes transmises par lien ne créent pas de vente.
- L’APK Android actuel est une préversion de test signée en debug et porte le package `cd.shopflow.app.test`. Une nouvelle version de test est préparée en `1.0.2` / `versionCode 3`; elle ne doit pas être annoncée comme une version de production.
- La version iPhone accessible sans IPA est la PWA installée depuis Safari. Le build simulateur iOS n’est pas une IPA signée destinée au public.

## Ordre recommandé des travaux

### 1. Verrouiller les règles du compte et de la boutique

Décider si un compte commence avec une boutique et peut en ajouter d’autres, comment les employés/gérants sont invités, et quelle méthode d’identification est supportée. Prévoir vérification d’adresse e-mail, réinitialisation du mot de passe, fermeture de compte et récupération de boutique.

### 2. Modèle de données multi-boutique — socle créé

Les migrations de départ couvrent profils, boutiques, membres/rôles, abonnements, enregistrements métier tenant-isolés et photos privées. RLS est activé; une recette avec deux vrais comptes et les rôles employés reste à faire. Les clés privées Supabase restent exclusivement côté serveur.

### 3. Authentification sociale — intégrée, fournisseurs à configurer

L’inscription ShopFlow se fait par Google, GitHub ou Facebook; aucun formulaire de création e-mail/mot de passe n’est proposé. La connexion e-mail reste uniquement pour les anciens comptes. Configurer chaque fournisseur OAuth dans Supabase, ajouter la clé publishable dans Render, puis tester les retours OAuth et l’isolation avant publication.

### 4. Import local et synchronisation — en place

L’import offre un aperçu et une confirmation, conserve la sauvegarde d’origine, n’écrit que dans une boutique cloud vide, téléverse les photos privées puis vérifie les données relues. La synchronisation automatique des instantanés est en place; la copie locale et les sauvegardes exportées restent distinctes. Une recette multi-appareils complète reste à faire.

### 5. Accès de test et abonnements — paiement non obligatoire

L’interface de test ne bloque pas l’accès après sept jours et ne propose aucun paiement. Les prix mensuels restent affichés à titre indicatif. Cet ajustement ne change pas les états d’abonnement, comptes ou données existants dans Supabase; aucune migration n’est exécutée pendant ce déploiement. Le prochain prestataire sera choisi séparément avant toute intégration.

### 6. Choisir puis intégrer les paiements réels

Choisir un prestataire réellement disponible pour l’entreprise en RDC et ses moyens (Mobile Money, carte, etc.). Il faudra un compte marchand, un environnement de test, un flux de paiement côté serveur, une validation par webhook signé, des identifiants de transaction, la gestion des échecs/remboursements et des tests de rapprochement. Ne jamais demander ni enregistrer un PIN Mobile Money ou une donnée de carte dans ShopFlow.

### 7. Préparer conformité et exploitation

Rédiger et publier les conditions d’utilisation, politique de confidentialité, politique de conservation/suppression des données et coordonnées de support. Définir sauvegardes/restauration, journalisation sans secrets, alertes d’incident et procédure de support. Confirmer les obligations applicables au pays et au prestataire de paiement avant encaissement.

### 8. Faire une recette de sécurité et d’usage

Tester isolation des boutiques et rôles, inscription/confirmation/récupération, perte de réseau, migration des anciennes données, synchronisation concurrente, export, abonnements et webhooks en test. Refaire la recette du catalogue, photos, liens de demandes et WhatsApp sur téléphone réel. Vérifier les textes, prix, contact de support, accessibilité et performance.

### 9. Publier les versions de production

Après validation, configurer des projets/env séparés pour test et production, secrets de production, domaine HTTPS et supervision. Android nécessite un package de production distinct, une clé de signature de production sauvegardée en sécurité, versionnement et APK/AAB de release. iPhone reste la PWA Safari tant qu’une IPA signée n’est pas volontairement préparée. Le site public doit pointer uniquement vers les services de production validés.

## Décisions validées par le propriétaire

- Authentification : inscription uniquement par Google, GitHub ou Facebook. La connexion e-mail reste réservée aux comptes existants; aucune inscription e-mail/mot de passe ne doit être proposée.
- Un compte propriétaire peut gérer plusieurs boutiques selon son forfait. Tarifs indicatifs actuels : Starter 5 USD / mois (50 USD / an), Pro 12 USD / mois (120 USD / an), Business 25 USD / mois (250 USD / an), avec deux mois offerts sur l’annuel et conversion publique à 2 400 FC/USD. Seule la formule Business autorise plusieurs boutiques. Le plafond numérique de Business n’est pas confirmé : ne pas en inventer un.
- Les données locales existantes doivent être importées lors de la première connexion, sans écraser la sauvegarde locale tant que la migration n’a pas été confirmée.
- Le propriétaire vérifie actuellement l’accès marchand Fondeka. Le parcours souhaité couvre Orange Money, Airtel Money et M-Pesa en RDC; aucune intégration ni mise en production ne doit être activée avant vérification des routes et conditions réelles.

## Préparation restante

- Pour Google, GitHub et Facebook, créer une application OAuth chez chaque fournisseur et configurer son identifiant/secret dans le fournisseur correspondant de Supabase. L’URI callback de chacun est `https://sgiyuxpzqyyquvvznomn.supabase.co/auth/v1/callback`. Un SMTP personnalisé n’est pas nécessaire pour l’inscription OAuth seule, mais reste utile pour la connexion/récupération des anciens comptes e-mail.
- La configuration Supabase Auth et les redirections de production utilisent le domaine confirmé `https://shopflow-drc.onrender.com/app/`.
- L’APK de test Android 1.0.2 (`versionCode 3`, package `cd.shopflow.app.test`) a été reconstruit et publié le 26 octobre 2026. Il reste une préversion de test, pas un APK de production.
