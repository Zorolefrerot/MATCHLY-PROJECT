# IDREM ZENKAI

Première version du site de candidature pour un jeu RP Android privé, limité à **20 joueurs**. L’application Android n’est pas encore réalisée.

## Déjà fonctionnel

- Accueil responsive rouge/noir avec l’illustration fournie par le propriétaire.
- Présentation de l’univers, filtres des 14 clans et FAQ.
- Inscription pseudo/e-mail/mot de passe, connexion et déconnexion.
- Candidature en quatre étapes et quiz de 10 questions.
- Espace candidat : dossier, décision, message et héritage après acceptation.
- Administration privée : recherche et filtres, acceptation/refus/liste d’attente, messages, édition du quiz et historique.
- Base SQLite persistante, mots de passe hachés avec scrypt et sessions côté serveur.
- Limite de 20 admissions et tirages atomiques, définitifs et idempotents.
- Maximum de 3 membres par clan rare ; exactement 3 potentiels Mokuton dans une cohorte complète de 20 attributions.
- Récupération du mot de passe implémentée, **inactive sans configuration SMTP**.

Aucun faux joueur, faux administrateur ou identifiant public de production n’est fourni. Les tests utilisent leur propre base en mémoire.

## Démarrage

Node.js **22.13 ou supérieur** requis (`node:sqlite`, encore expérimental selon la version).

```bash
npm ci
cp .env.example .env
npm run dev
```

Le site et son API sont servis sur `0.0.0.0:3000`. Le navigateur appelle `/api` sur le même domaine : pas d’adresse localhost embarquée dans le client. Vite accepte les hôtes d’aperçu Arena.

### Créer le compte propriétaire

Dans un **environnement privé** du serveur, renseigner `ADMIN_EMAIL`, `ADMIN_PASSWORD` (14 caractères minimum) et éventuellement `ADMIN_NAME`, puis :

```bash
npm run admin
```

Retirer ensuite `ADMIN_PASSWORD` de l’environnement. Se connecter normalement sur `/connexion`, puis accéder à `/admin`. Il ne peut y avoir qu’un propriétaire et un inscrit ne peut pas s’attribuer ce rôle. Ne jamais envoyer de mot de passe ou de clé en conversation ni les ajouter à Git.

Depuis un téléphone, cette configuration se fera dans l’interface privée de l’hébergeur et sa console en ligne. Elle n’a volontairement pas de route publique de création du propriétaire.

### Base de données

Par défaut : `data/idrem.sqlite`, configurable avec `DATABASE_PATH`. Le dossier `data/` est ignoré par Git. Les données de l’aperçu sont locales à cet environnement : elles ne sont pas un hébergement de production garanti et ne sont pas transférées par un simple clone Git.

En production, utiliser un **volume persistant**, sauvegarder SQLite avec son mécanisme de sauvegarde ou arrêter proprement l’application avant copie, et tester la restauration. Ne pas placer cette base sur un disque éphémère de fonction serverless. Ce prototype est prévu pour **une instance de serveur**, pas plusieurs processus sur des copies de base indépendantes.

### Récupération de compte

Configurer `PUBLIC_ORIGIN` (URL HTTPS publique sans slash final), `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` et, si requis, `SMTP_USER`/`SMTP_PASS`.

Les liens expirent après 30 minutes, sont à usage unique et une modification du mot de passe invalide les anciennes sessions. Sans SMTP, le site affiche explicitement l’indisponibilité ; aucun faux e-mail n’est annoncé comme envoyé. L’envoi réel doit être testé avec le fournisseur choisi.

### Production

```bash
npm run build
npm start
```

- Servir derrière un reverse proxy HTTPS, renseigner `PUBLIC_ORIGIN`.
- Le serveur fait confiance à **un proxy** pour les adresses IP ; ajuster cette politique à l’infrastructure réelle et empêcher le contournement direct du proxy.
- Les cookies de production sont `Secure`, `HttpOnly`, `SameSite=Lax`.
- La protection de provenance attend que le proxy conserve l’hôte public ou que `PUBLIC_ORIGIN` corresponde au domaine utilisé.
- Aucun service payant n’est activé. Le choix d’un hébergeur gratuit reste à faire ; les limites, la persistance, l’e-mail et la disponibilité permanente doivent être vérifiés.

## Tests

```bash
npm test
npm run build
npm audit
```

Tests navigateur (Chromium nécessaire) :

```bash
npx playwright install --with-deps chromium
npm run test:browser
```

Un navigateur déjà installé peut être utilisé via `CHROMIUM_EXECUTABLE`. Les tests navigateur démarrent une application isolée sur un port temporaire et ne modifient jamais la base de l’aperçu.

Couverture : inscription, permissions, confidentialité des dossiers et réponses du quiz, CSRF, admission, plafond de 20 joueurs, trois Mokuton, plafonds des clans rares, double tirage, persistance, navigation mobile, candidature complète, décision administrative et édition du quiz.

## Règles provisoires et limites explicites

- Poids initiaux : Uchiwa/Uzumaki/Senju à 8 % chacun. **Proposition technique** pour le reste : les 76 % sont répartis également entre les 11 autres clans ; lorsqu’un clan est complet, les poids restants sont renormalisés. À valider avec le propriétaire avant une vraie campagne.
- Les 20 emplacements Mokuton sont mélangés secrètement côté serveur avec exactement 3 positifs. Les attributions se font sans remise. La garantie porte sur les 20 tirages terminés, pas sur les premières admissions.
- Retirer une admission est volontairement bloqué dans cette version : définir d’abord les règles des remplacements et des places rares.
- Une candidature envoyée ne peut pas encore être modifiée. Le formulaire n’est pas sauvegardé avant l’envoi final et le signale.
- Une modification du quiz ne change pas les dossiers déjà envoyés : chaque dossier conserve les questions et le corrigé utilisés.
- Avant collecte publique : compléter l’identité/contact du responsable, la politique de conservation, les règles d’âge et la procédure d’exercice des droits. Ajouter la vérification d’e-mail si nécessaire.
- L’application Android, le serveur de combat, les inventaires, les quêtes jouables et les IA externes ne sont pas livrés dans cette étape.

## Fichiers

- `src/` : interface React et styles, polices servies localement.
- `server/` : Express, authentification, SQLite, quiz, attributions.
- `public/idrem-zenkai.png` : image fournie, récupérée depuis le fichier `file_00000000b7f0820eb34e34f06bba58d8.png` du dépôt principal.
- `tests/` : tests serveur et navigateur.
- `docs/CAHIER_DES_CHARGES.md` : synthèse des décisions du projet.

## Ressources et droits

L’illustration provient du dépôt du propriétaire ; son inclusion ne constitue pas une vérification de licence. Naruto et les autres univers cités restent la propriété de leurs ayants droit. Vérifier les autorisations avant diffusion publique. Polices Barlow Condensed et DM Sans distribuées via Fontsource sous leurs licences ouvertes ; icônes Lucide sous licence ISC.
