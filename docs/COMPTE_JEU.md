# Compte du jeu — incrément 0.6

**Code prêt, tests locaux et compilation Android réussis. Pas encore déployé ni essayé contre le service Render/Neon du propriétaire.** L’entraînement reste hors ligne. Ce premier raccordement est un espace de compte avec apparence sauvegardée, pas un monde multijoueur ni une sauvegarde de progression de combat.

## Activation depuis le téléphone

1. Dans le service existant sur [Render](https://dashboard.render.com/), utiliser **Manual Deploy → Deploy latest commit**. La branche reste `arena/01a08158-matchly-project`. Ne pas créer de second service et ne pas remplacer les variables privées existantes.
2. Attendre **Live**, puis vérifier que le site s’ouvre toujours et que le compte propriétaire fonctionne. Le déploiement applique automatiquement deux tables supplémentaires ; aucun tirage/admission n’est relancé.

Après cela seulement : installer l’APK 0.6 indiquée dans [`game/README.md`](../game/README.md), ouvrir **MON COMPTE**, saisir l’adresse HTTPS exacte du site (origine uniquement, sans chemin), puis les identifiants d’un **compte joueur accepté ayant déjà reçu son attribution sur le site**. Ne jamais envoyer de mot de passe dans la conversation. Le propriétaire administrateur reste séparé des places joueurs ; pas de contournement automatique de l’admission.

L’URL réelle du service n’étant pas enregistrée dans le dépôt, aucune adresse de production n’a été devinée/compilée dans l’APK. Elle se renseigne dans l’application et reste affichée. Seule cette origine publique est mémorisée sur le téléphone. Les redirections sont refusées et les certificats HTTPS restent vérifiés.

## Fonctionnement

- **Connexion native dédiée**, distincte des cookies du navigateur. Le site conserve son authentification et ses protections actuelles.
- Admission, rôle joueur et attribution existante vérifiés à la connexion, à la lecture et à chaque sauvegarde. En attente, liste d’attente, refus ou compte administrateur : pas de personnage connecté. Admis sans tirage : retour vers le site, aucun tirage lancé par l’APK.
- Identité renvoyée depuis la candidature/attribution : identifiant du compte, nom du personnage, clan, affinité, potentiel Mokuton. Genin à Konoha pour cet incrément ; aucune progression/rang gagné n’est encore enregistrée.
- Apparence du compte distincte de l’apparence de l’entraînement. Elle se retrouve en se reconnectant, y compris depuis une réinstallation. Aucun import automatique du fichier local, ni remplacement du combattant hors ligne.
- **MODIFIER L’APPARENCE → ENREGISTRER SUR MON COMPTE** : confirmation uniquement après réponse positive du serveur. Une erreur laisse le brouillon visible. Après interruption réseau, actualiser pour vérifier si l’écriture a abouti ; une réponse perdue ne signifie pas nécessairement une sauvegarde perdue.
- Le numéro de révision empêche un écran ancien d’écraser une nouvelle apparence. Sur conflit : fermer le créateur, **ACTUALISER**, puis rouvrir l’éditeur. Pas de fusion automatique silencieuse.
- **APPARENCE HORS LIGNE** continue à utiliser `user://appearance-v1.json`, sans requête réseau. Ses choix ne changent pas le compte et une désinstallation les efface.

## Sessions et sécurité

- Jeton aléatoire de 32 octets ; seulement son SHA-256 en base. Durée de **2 heures**, un jeton natif actif par compte ; une nouvelle connexion révoque l’ancienne.
- Mot de passe et jeton uniquement en mémoire de l’application, jamais dans une sauvegarde, les logs, une URL ou le dépôt. Le champ mot de passe est vidé dès l’envoi. Reconnexion nécessaire après fermeture de l’application.
- Déconnexion native révoque le jeton ; réinitialisation du mot de passe révoque aussi les sessions natives et celles du site. En cas d’échec réseau à la déconnexion, le jeton est oublié localement mais peut rester valide côté serveur jusqu’à expiration.
- Un jeton natif ne peut pas authentifier une requête d’administration ou de tirage du site. Un cookie du site ne suffit pas pour l’API native.
- JSON borné et schéma cosmétique strict : champs supplémentaires, valeurs non entières/hors catalogue et versions inconnues refusés. Aucun `user_id`, clan, santé, chakra, récompense ou droit d’équipement n’est accepté dans une sauvegarde.
- Limitation existante des tentatives par IP (processus, pas un système anti-DDoS distribué), pas de polling périodique. Render Free et Neon peuvent dormir ; délai client 90 s, réponse maximale 32 Kio. Aucun service payant ou secret supplémentaire requis.
- Android demande désormais **INTERNET**, et toujours pas de micro/caméra/contacts/localisation/stockage externe. Le téléphone parle au serveur HTTPS, jamais directement à Neon.

## API, protocole 1

| Requête | Résultat |
|---|---|
| `POST /api/game/login` `{email,password}` | `{token,expiresAt,profile}` après authentification et admission |
| `GET /api/game/profile` + Bearer | Identité et apparence du compte authentifié |
| `PUT /api/game/appearance` + Bearer | Sauvegarde transactionnelle, retour du profil actualisé |
| `POST /api/game/logout` + Bearer | Révocation idempotente |

La sauvegarde contient exactement `schemaVersion: 1`, `expectedRevision` et `appearance` (les neuf identifiants cosmétiques). `revision: 0` / `appearance: null` signifie qu’aucune apparence du compte n’a encore été sauvegardée. Les bornes et l’ordre des palettes constituent le schéma v1, contrôlé par un test partagé avec les catalogues Godot.

Tables ajoutées de manière idempotente :
- `game_sessions(token, user_id UNIQUE, expires)` ; index d’expiration.
- `character_appearances(user_id PRIMARY KEY, appearance, revision, updated)`.

Les utilisateurs, candidatures, allocations et réserves Mokuton existants ne sont ni déplacés, ni réinitialisés. Pas de commande destructive ni de migration manuelle dans Neon. Un retour au serveur précédent peut laisser ces nouvelles tables en place, sans les supprimer.

## Preuves et limites

- **22 tests Node** réussis ; contrat HTTP réel exercé sur SQLite et sur un PostgreSQL jetable.
- **7 tests d’intégration PostgreSQL** réussis, dont admissions/tirages concurrents antérieurs et le nouveau contrat natif : rôle/admission, isolation, deux écritures concurrentes (une seule gagne), relecture, expiration, déconnexion et reset de mot de passe.
- **146 assertions Godot** réussies. Les tests d’interface connectée injectent des réponses via une sous-classe réservée aux tests, sans envoyer d’identifiants réels. Ils ne constituent pas un test HTTPS de bout en bout depuis Android.
- APK exportée/signée et permissions vérifiées ; capture du formulaire inspectée. Aucun essai sur téléphone ni connexion au vrai service de production pendant ces travaux. Détails et empreintes : [`game/VALIDATION.md`](../game/VALIDATION.md).

### Essai après déploiement

Sur un compte joueur admis : connecter, vérifier l’identité par rapport au site, sauvegarder une apparence, déconnecter/reconnecter et vérifier sa restauration. Vérifier aussi qu’un compte non admis reste bloqué et que l’entraînement reste utilisable sans connexion. Ne pas créer de nouvelles admissions simplement pour remplir un test ; garder la sélection manuelle et les vingt places.
