# IDREM ZENKAI

Site de candidature pour un jeu RP Android privé, limité à **20 joueurs**. Un [prototype Android solo avec entraînement et créateur de personnage](game/README.md) est disponible ; le jeu RP multijoueur connecté n’est pas encore réalisé.

## Déployer gratuitement depuis un téléphone

**[Guide Render Free + Neon Free](docs/DEPLOIEMENT_RENDER_NEON.md)**

Le dépôt inclut `render.yaml`, l’accès PostgreSQL compatible Neon et la création privée du propriétaire au premier démarrage. Rien n’est déployé automatiquement dans les comptes de l’utilisateur. Configurer les secrets dans Render, jamais dans Git ni dans la conversation.

Branche de cette version : **`arena/01a08158-matchly-project`** (pas `main`).

## Fonctionnalités

- Accueil responsive rouge/noir avec l’image fournie, 14 clans filtrables et FAQ.
- Inscription pseudo/e-mail/mot de passe, connexion et déconnexion.
- Candidature en quatre étapes avec quiz de 10 questions et conservation du corrigé utilisé.
- Espace candidat : dossier, décision, message et héritage après admission.
- Administration privée : recherche, filtres, décisions, messages, édition du quiz et historique.
- **PostgreSQL sur Neon pour Render**, SQLite conservé pour les essais locaux.
- Transactions : maximum de 20 admissions, tirages définitifs et idempotents, maximum de trois membres par clan rare et exactement trois potentiels Mokuton dans une cohorte complète de vingt tirages.
- Mots de passe hachés avec scrypt, cookies de session `HttpOnly`, contrôles d’accès et de provenance.
- Récupération de compte facultative par HTTPS/Resend ou SMTP hors Render Free ; explicitement indisponible sans configuration d’envoi.

## Démarrer localement

Node.js **22.13+**, version de déploiement fixée à **22.22.3**.

```bash
npm ci
cp .env.example .env
npm run dev
```

Le site et l’API écoutent sur `0.0.0.0:3000`. Le navigateur appelle `/api` sur le même domaine ; aucune URL de base ni clé privée n’est compilée dans React. Les hôtes d’aperçu sont acceptés en développement.

- `DATABASE_URL` renseigné : PostgreSQL avec TLS vérifié (URL poolée Neon recommandée).
- Sans `DATABASE_URL`, en local : SQLite dans `data/idrem.sqlite`, ignoré par Git.
- Sur Render (`RENDER=true`), `DATABASE_URL` est **obligatoire** : pas de repli silencieux sur un disque éphémère.

### Compte propriétaire

Avant le premier démarrage, renseigner dans l’environnement privé `ADMIN_EMAIL`, `ADMIN_PASSWORD` (14 à 128 caractères), `ADMIN_NAME` (3 à 30 caractères). Le serveur initialise l’unique propriétaire avant d’accepter les connexions. Il ne transforme jamais un compte joueur existant en administrateur et ne remplace jamais un mot de passe au redémarrage.

Après une première connexion réussie, retirer `ADMIN_PASSWORD` et `ADMIN_EMAIL`. Le compte demeure dans la base. Hors Render, la commande suivante utilise le même mécanisme :

```bash
npm run admin
```

Aucun compte privilégié ni identifiant public de production n’est fourni. Les tests créent des comptes dans des bases jetables uniquement.

### Version de production

```bash
npm ci --include=dev
npm run build
npm prune --omit=dev
npm start
```

`npm start` active les cookies `Secure` : utiliser HTTPS derrière un reverse proxy. Render fournit automatiquement le port et l’URL externe. `PUBLIC_ORIGIN` peut les compléter pour un domaine personnalisé.

Le serveur fait confiance à **un proxy** pour les adresses IP. Adapter cette politique et interdire le contournement direct du proxy sur un autre hébergeur. Le point `/healthz` vérifie le processus sans requête PostgreSQL afin de ne pas réveiller Neon à chaque contrôle. Arrêt propre des connexions sur SIGTERM/SIGINT.

### Persistance et transactions

- Le schéma est créé de façon idempotente au démarrage. Le tirage des emplacements Mokuton est initialisé une seule fois.
- PostgreSQL : pool limité à quatre connexions ; transactions sur un client réservé et verrou consultatif **transactionnel**, compatible avec le pooler Neon. Les admissions/attributions sont sérialisées même entre deux pools.
- SQLite local : file d’exécution empêchant l’entrelacement des transactions asynchrones.
- L’identité et les compteurs sont stockés en base, jamais dans la mémoire du serveur web.
- Les données SQLite de l’aperçu ne sont **pas transférées automatiquement** dans un nouveau projet Neon. Rien ne supprime l’ancien fichier. Préparer un transfert contrôlé si ces données doivent être conservées.
- Sauvegarder la base et tester la restauration avant ouverture publique. Les quotas et les fonctions de sauvegarde dépendent de l’offre choisie.

### E-mails

Sans fournisseur configuré, la connexion et les candidatures fonctionnent, mais la récupération reste indisponible. Pour Render, utiliser un fournisseur HTTPS : `RESEND_API_KEY`, `MAIL_FROM` (expéditeur autorisé) et l’origine publique. SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`) reste supporté **hors Render Free**, qui bloque les ports SMTP habituels.

Les liens expirent en 30 minutes, ne sont utilisables qu’une fois et invalident les sessions lors du changement. Le délai d’envoi est borné. Ne pas annoncer l’envoi réel comme testé avant de configurer et vérifier le fournisseur choisi. Aucune offre payante n’est activée par ce code.

## Tests

```bash
npm test                  # SQLite, HTTP, configuration, TLS, bootstrap et e-mails simulés
npm run test:postgres     # Vrai PostgreSQL local jetable, sans connexion à Neon
npm run build
npm audit
```

Le test PostgreSQL lance le binaire de développement `embedded-postgres` installé via npm, sur un port local temporaire, puis détruit son cluster de test. Il couvre le schéma, les redémarrages, la concurrence entre deux pools, les plafonds de la cohorte, la confidentialité des dossiers, les snapshots du quiz et les réinitialisations concurrentes. Le processus doit être lancé par un utilisateur non root comme dans un environnement de développement ordinaire.

Tests navigateur :

```bash
npx playwright install --with-deps chromium
npm run test:browser
```

Un Chromium déjà installé peut être utilisé via `CHROMIUM_EXECUTABLE`. Le test navigateur démarre un serveur isolé et n’accède pas aux données de l’aperçu.

## Limites du produit

- Probabilités initiales : Uchiwa/Uzumaki/Senju, 8 % chacun. **Proposition technique à valider** : répartir les 76 % restants également entre onze clans et renormaliser les poids disponibles lorsqu’un clan atteint sa limite.
- Exactement trois Mokuton **sur vingt attributions terminées** ; pas nécessairement parmi les premières admissions.
- Le retrait d’une admission est bloqué tant que les règles des remplacements et des places rares ne sont pas définies.
- Une candidature envoyée n’est pas encore modifiable. Le formulaire ne persiste qu’après son envoi final, ce que l’interface indique.
- Une édition du quiz n’altère pas les dossiers déjà envoyés.
- Les offres gratuites peuvent se mettre en veille et suspendre le service au dépassement de quotas. Elles ne garantissent pas le futur serveur de jeu 24 h/24.
- Les mentions de confidentialité, contact du responsable, durées de conservation, suppression, âge des participants et éventuelle vérification d’e-mail restent à finaliser avant collecte publique.
- Android, serveur de combat, inventaires et quêtes jouables restent hors de cette livraison.

## Organisation

- `src/` : interface React et styles ; polices servies localement.
- `server/database.js`, `server/schema.js`, `server/store.js` : accès asynchrone aux données, schéma et règles transactionnelles.
- `server/bootstrap-admin.js` : initialisation privée du propriétaire.
- `server/app.js`, `server/mailer.js` : API et récupération de compte.
- `public/idrem-zenkai.png` : illustration fournie par le propriétaire, issue du fichier `file_00000000b7f0820eb34e34f06bba58d8.png` de la branche principale.
- `render.yaml` : configuration Free, sans disque ni base Render payants.
- `docs/CAHIER_DES_CHARGES.md` : décisions du projet.
- `docs/DEPLOIEMENT_RENDER_NEON.md` : parcours de déploiement depuis un téléphone.

## Ressources et droits

L’inclusion de l’image du dépôt ne vérifie pas sa licence. Naruto et les autres univers cités appartiennent à leurs ayants droit : vérifier les autorisations avant diffusion. Barlow Condensed et DM Sans sont distribuées via Fontsource sous licences ouvertes ; icônes Lucide sous licence ISC.


### Favicon et icônes mobiles

L’image fournie est recadrée au format carré pour créer le favicon ICO (16/32/48/64 px), les PNG d’onglet (32/48 px), l’icône Apple (180 px) et les icônes de raccourci mobile (192/512 px). L’illustration d’origine reste intacte. Le monogramme du bandeau est séparé dans `public/brand-mark.svg`.

Les fichiers sont déjà générés et versionnés : aucune dépendance graphique n’est nécessaire sur Render. Pour les régénérer après modification de l’image, installer ImageMagick dans l’environnement de développement puis lancer `bash scripts/generate-icons.sh`. Le manifeste décrit un raccourci web ; il ne fournit ni jeu Android ni mode hors ligne.

Après mise à jour du dépôt, lancer un déploiement manuel Render. Les références d’icônes sont versionnées pour limiter les anciens favicons en cache.

## Prototype Android séparé

Un projet Godot 4.5.1 **solo/hors ligne** est maintenant préparé dans [`game/`](game/README.md) : arène procédurale, commandes tactiles, quatre techniques de test et adversaire programmé. Il ne se connecte pas aux comptes et candidatures Render/Neon et ne modifie pas leurs données. Les scripts de tests, d’export APK et un modèle de workflow GitHub sont décrits dans son guide. Le propriétaire a activé le workflow depuis GitHub ; une première APK de test a été compilée et vérifiée, avec le lien de téléchargement dans le guide Android. Les essais sur un vrai téléphone restent à réaliser : le site n’annonce pas automatiquement une APK disponible.
