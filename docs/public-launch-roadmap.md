# Feuille de route — rendre ShopFlow opérationnel publiquement

Mise à jour : 26 octobre 2026. Ce document distingue les fonctions de démonstration des services réellement connectés.

## État constaté

- Le catalogue public et ses photos utilisent le projet Supabase existant. Le contrôle Render `/api/health` a récemment confirmé la base et le stockage d’images prêts.
- Le service Supabase Auth est actif, mais il n’est pas encore utilisé par l’application. Son URL de site est encore `http://localhost:3000`, sa liste de redirections est vide, l’inscription e-mail est activée avec confirmation obligatoire, et l’inscription par téléphone est désactivée. Il faudra configurer les URL publiques et un service e-mail avant la mise en ligne des inscriptions.
- L’historique des migrations Supabase est vide. La table du catalogue a été préparée séparément; les prochaines tables de production doivent être créées et versionnées par des migrations suivies.
- L’inscription et la connexion visibles dans l’application sont encore des simulations d’interface : elles ne créent ni compte vérifié ni session serveur.
- Les paramètres, produits, ventes, crédits et dépenses de la boutique sont conservés localement dans le navigateur/l’appareil. Ils ne sont pas synchronisés entre appareils et ne constituent pas encore une base de données de gestion.
- La sélection d’abonnement est locale et simulée. Aucun paiement ou statut d’abonnement n’est vérifié par un serveur.
- Le catalogue reste une fonction distincte : publier un catalogue ne crée pas un compte utilisateur et les demandes transmises par lien ne créent pas de vente.
- L’APK Android actuel est une préversion de test signée en debug et porte le package `cd.shopflow.app.test`. Une nouvelle version de test est préparée en `1.0.2` / `versionCode 3`; elle ne doit pas être annoncée comme une version de production.
- La version iPhone accessible sans IPA est la PWA installée depuis Safari. Le build simulateur iOS n’est pas une IPA signée destinée au public.

## Ordre recommandé des travaux

### 1. Verrouiller les règles du compte et de la boutique

Décider si un compte commence avec une boutique et peut en ajouter d’autres, comment les employés/gérants sont invités, et quelle méthode d’identification est supportée. Prévoir vérification d’adresse e-mail, réinitialisation du mot de passe, fermeture de compte et récupération de boutique.

### 2. Créer le modèle de données multi-boutique

Préparer des migrations pour les profils, boutiques, membres/rôles, paramètres, produits, mouvements de stock, ventes, dépenses, crédits et abonnements. Chaque ligne doit être rattachée à une boutique; les règles RLS doivent empêcher un compte de consulter les données d’une autre boutique. Garder les secrets Supabase uniquement sur le serveur; une clé publique peut être utilisée côté client seulement avec des politiques RLS vérifiées.

### 3. Connecter une vraie authentification

Remplacer les callbacks de démonstration par un fournisseur d’authentification, créer et vérifier les comptes, gérer les sessions et déconnexions, mot de passe oublié, erreurs de réseau et protection contre les tentatives répétées. L’accès aux données doit être autorisé par le serveur et la base, pas par un PIN ou un indicateur stocké uniquement sur l’appareil.

### 4. Synchroniser les données et préserver celles déjà présentes

Concevoir un import contrôlé des boutiques locales lors de la création/connexion du compte. Ajouter synchronisation, reprise hors connexion, règles de résolution des conflits, export/sauvegarde et restauration. Tester le changement de téléphone et la suppression/récupération du compte avant d’exiger une connexion.

### 5. Rendre les essais et abonnements fiables

Démarrer les 7 jours d’essai côté serveur au moment réel de création de la boutique. Lire les droits d’accès depuis un statut d’abonnement serveur, jamais depuis `planPaid` modifiable localement. Ne proposer que les prix et avantages validés.

### 6. Choisir puis intégrer les paiements réels

Choisir un prestataire réellement disponible pour l’entreprise en RDC et ses moyens (Mobile Money, carte, etc.). Il faudra un compte marchand, un environnement de test, un flux de paiement côté serveur, une validation par webhook signé, des identifiants de transaction, la gestion des échecs/remboursements et des tests de rapprochement. Ne jamais demander ni enregistrer un PIN Mobile Money ou une donnée de carte dans ShopFlow.

### 7. Préparer conformité et exploitation

Rédiger et publier les conditions d’utilisation, politique de confidentialité, politique de conservation/suppression des données et coordonnées de support. Définir sauvegardes/restauration, journalisation sans secrets, alertes d’incident et procédure de support. Confirmer les obligations applicables au pays et au prestataire de paiement avant encaissement.

### 8. Faire une recette de sécurité et d’usage

Tester isolation des boutiques et rôles, inscription/confirmation/récupération, perte de réseau, migration des anciennes données, synchronisation concurrente, export, abonnements et webhooks en test. Refaire la recette du catalogue, photos, liens de demandes et WhatsApp sur téléphone réel. Vérifier les textes, prix, contact de support, accessibilité et performance.

### 9. Publier les versions de production

Après validation, configurer des projets/env séparés pour test et production, secrets de production, domaine HTTPS et supervision. Android nécessite un package de production distinct, une clé de signature de production sauvegardée en sécurité, versionnement et APK/AAB de release. iPhone reste la PWA Safari tant qu’une IPA signée n’est pas volontairement préparée. Le site public doit pointer uniquement vers les services de production validés.

## Décisions nécessaires avant les intégrations d’authentification et de paiement

- Identifiant de compte : e-mail + mot de passe, téléphone, ou les deux ?
- Une adresse e-mail doit-elle être vérifiée avant l’accès aux données ?
- Le propriétaire peut-il gérer plusieurs boutiques et inviter des vendeurs ?
- Quels moyens de paiement et quel prestataire marchand sont déjà disponibles pour l’entreprise en RDC ?
- Quelles données locales doit-on migrer lors de la première inscription ?
- Le lancement initial vise-t-il un pilote APK/PWA, ou une publication Android de production dès le départ ?
