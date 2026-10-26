# Feuille de route — rendre ShopFlow opérationnel publiquement

Mise à jour : 26 octobre 2026. Ce document distingue les fonctions de démonstration des services réellement connectés.

## État constaté

- Le catalogue public et ses photos utilisent le projet Supabase existant. Le contrôle Render `/api/health` a récemment confirmé la base et le stockage d’images prêts.
- Supabase Auth est utilisé par l’application. L’URL de site et les redirections sont réglées pour `https://shopflow-drc.onrender.com` et `/app/`. L’inscription publique proposée est sociale uniquement : Google, GitHub ou Facebook; ces fournisseurs attendent encore leurs identifiants OAuth. Le formulaire e-mail/mot de passe d’inscription a été retiré; la connexion e-mail reste pour les comptes existants.
- Trois migrations Supabase créent le socle multi-boutique RLS, le bucket privé par boutique et l’import non-écrasant. Le catalogue public reste séparé. Voir `supabase/20261026_shop_accounts.sql`, `supabase/20261026_shop_import_assets.sql` et `docs/supabase-auth-setup.md`.
- Les écrans d’inscription/connexion appellent Supabase et gèrent la session, les boutons OAuth, la création/sélection de boutiques et la récupération des comptes existants. Les boutons sociaux restent désactivés tant que la clé publishable Render et les fournisseurs OAuth correspondants ne sont pas configurés.
- Un import local avec aperçu, confirmation, sauvegarde conservée et photos dans le bucket privé est en place. Les changements post-import restent locaux jusqu’à la synchronisation continue; les données existantes n’ont pas été importées automatiquement.
- Le backend démarre l’essai de sept jours lors de la création de la première boutique. Le paiement et le statut d’abonnement actif ne sont pas encore raccordés à un prestataire.
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

### 4. Import local — en place; synchronisation continue restante

L’import offre un aperçu et une confirmation, conserve la sauvegarde d’origine, n’écrit que dans une boutique cloud vide, téléverse les photos privées puis vérifie les données relues. Il reste à concevoir la synchronisation continue, la reprise hors connexion, les conflits multi-appareils, ainsi que l’export/restauration cloud.

### 5. Essais et abonnements — essai côté serveur en place

Les 7 jours commencent côté serveur lors de la création de la première boutique. Le statut payant n’est pas encore mis à jour par un prestataire réel; ne jamais faire confiance à `planPaid` local pour valider un paiement ou une entité payée.

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
- Un compte propriétaire peut gérer plusieurs boutiques selon son forfait. Les plans affichés dans `SubscriptionView.tsx` restent mensuels : Starter 5 USD, Pro 12 USD, Business 25 USD; seule la formule Business autorise plusieurs boutiques. Le plafond numérique de Business n’est pas confirmé : ne pas en inventer un.
- Les données locales existantes doivent être importées lors de la première connexion, sans écraser la sauvegarde locale tant que la migration n’a pas été confirmée.
- Le propriétaire ne possède pas encore de compte marchand; une passerelle doit couvrir Orange Money, Airtel Money, M-Pesa et Visa/Mastercard en RDC.

## Préparation restante

- **CinetPay est le premier candidat recommandé** : sa [table officielle des moyens de paiement](https://docs.cinetpay.com/api/1.0-fr/checkout/tableau) documente Orange Money, M-Pesa et Airtel en RDC, ainsi que Visa/Mastercard en USD. Les moyens, devises et frais doivent être confirmés par écrit par le service marchand avant toute annonce tarifaire; la [page tarifaire](https://cinetpay.com/pricing) indique que les frais varient selon le volume.
- La documentation décrit une API de paiement avec identifiant unique, et demande de vérifier l’état réel de chaque transaction via notification et vérification serveur ([initialisation](https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation), [notification](https://docs.cinetpay.com/api/1.0-fr/checkout/notification)). Elle ne confirme pas encore une facturation automatique récurrente pour ShopFlow; le [renouvellement manuel](https://docs.cinetpay.com/api/1.0-fr/BO/service) dans le portail marchand existe. Confirmer ce point avant de décider si les forfaits seront renouvelés manuellement ou automatiquement.
- L’ouverture d’un compte marchand CinetPay et l’obtention d’un `APIKEY` et d’un `SITEID` sont nécessaires avant l’intégration ([prérequis CinetPay](https://docs.cinetpay.com/api/1.0-fr/introduction/prerequis)). Les secrets iront dans les variables serveur Render, jamais dans l’application ni dans le chat.
- Pour Google, GitHub et Facebook, créer une application OAuth chez chaque fournisseur et configurer son identifiant/secret dans le fournisseur correspondant de Supabase. L’URI callback de chacun est `https://sgiyuxpzqyyquvvznomn.supabase.co/auth/v1/callback`. Un SMTP personnalisé n’est pas nécessaire pour l’inscription OAuth seule, mais reste utile pour la connexion/récupération des anciens comptes e-mail.
- La configuration Supabase Auth actuelle pointe toujours sur `http://localhost:3000`; les URL de site/redirection de production doivent être ajoutées après stabilisation du domaine public.
- L’APK de test Android 1.0.2 (`versionCode 3`, package `cd.shopflow.app.test`) a été reconstruit et publié le 26 octobre 2026. Il reste une préversion de test, pas un APK de production.
