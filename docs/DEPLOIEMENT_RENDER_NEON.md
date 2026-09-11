# Mettre IDREM ZENKAI en ligne — Render Free + Neon Free

Ce guide concerne **le site de candidature**, pas encore le jeu Android. Le code est préparé ; la création des comptes Render/Neon ne déploie pas automatiquement le site. Aucun accès à tes comptes, secret ou service payant n’est configuré par ce dépôt.

## 1. Préparer Neon depuis ton téléphone

1. Ouvre <https://console.neon.tech/>.
2. Crée un projet appelé `idrem-zenkai` en restant sur l’offre **Free**.
3. Si tu peux choisir la région, prends **AWS Frankfurt** ; nous utiliserons aussi Frankfurt pour Render. Si ton projet existe déjà dans une autre région, ne le supprime pas : choisis une région Render proche si disponible.
4. Dans le projet, ouvre **Connect** et sélectionne la base et son rôle. Tu peux garder `neondb` et le rôle proposés par Neon pour cette première version.
5. Active **Connection pooling**, puis copie la **Connection string** PostgreSQL. Copie uniquement l’URL commençant par `postgresql://` (pas une commande `psql`, pas les guillemets).
6. Garde la fenêtre Neon ouverte : cette valeur va dans `DATABASE_URL` sur Render, **jamais dans cette conversation, un fichier du dépôt ou une capture d’écran**.

Cette URL contient le mot de passe de la base. Si elle est exposée, régénère le mot de passe dans Neon et remplace `DATABASE_URL` dans Render. La connexion de l’application vérifie les certificats TLS, même si l’URL copiée utilise `sslmode=require`.

## 2. Créer le Web Service sur Render

1. Ouvre <https://dashboard.render.com/>.
2. Choisis **New → Web Service → Git Provider**.
3. Connecte ton compte GitHub à Render depuis son interface, puis sélectionne **`Zorolefrerot/MATCHLY-PROJECT`**.
4. Sélectionne **exactement cette branche**, pas `main` :

```text
arena/01a08158-matchly-project
```

5. Configure :

| Champ | Valeur |
|---|---|
| Name | `idrem-zenkai` (ou un nom disponible proposé par Render) |
| Language / Runtime | `Node` |
| Region | `Frankfurt` si disponible et proche de ta base |
| Root Directory | Laisser vide |
| Build Command | `npm ci --include=dev && npm run build && npm prune --omit=dev` |
| Start Command | `npm start` |
| Instance Type | **Free** |
| Health Check Path | `/healthz` |
| Auto-Deploy | Désactivé au départ ; utiliser les déploiements manuels |

**Ne crée pas de disque Render ni de base Render Postgres.** La base est déjà hébergée chez Neon. Un fichier `render.yaml` est également disponible pour une configuration Blueprint, mais le parcours manuel ci-dessus permet de vérifier tous les champs depuis un téléphone.

## 3. Ajouter les variables privées avant le premier déploiement

Dans **Environment Variables**, ajoute :

| Key | Value à saisir dans Render uniquement |
|---|---|
| `DATABASE_URL` | L’URL PostgreSQL copiée depuis Neon |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22.22.3` |
| `ADMIN_EMAIL` | Ton adresse e-mail pour te connecter en tant que propriétaire |
| `ADMIN_PASSWORD` | Un nouveau mot de passe fort, de **14 à 128 caractères** |
| `ADMIN_NAME` | Ton pseudo administrateur, par exemple `Hokage` (3 à 30 caractères) |

Ne mets **pas** `VITE_` devant ces noms. Ne mets pas de guillemets autour des valeurs. Les clés de Neon et les identifiants administrateur ne doivent jamais être accessibles au navigateur.

Laisse `PORT` à Render. Il est lu automatiquement. L’URL publique est également récupérée depuis `RENDER_EXTERNAL_URL`, fournie par Render ; il n’est pas nécessaire de deviner le domaine à l’avance.

### Ce que fait le premier démarrage

- Ouvre la connexion PostgreSQL.
- Crée les tables et index si absents, sans supprimer les données existantes.
- Prépare une seule fois les 20 emplacements, dont 3 potentiels Mokuton.
- Crée le propriétaire à partir des variables privées, **avant d’ouvrir l’accès HTTP**.
- Lance le site et son API sur le même domaine.

Si Neon n’est pas configuré, le démarrage s’arrête au lieu d’enregistrer discrètement les candidatures dans un fichier temporaire. Si le propriétaire n’existe pas encore et que ses variables sont absentes/invalides, Render ne publie pas un service prêt à recevoir des comptes joueurs.

## 4. Déployer, ouvrir et vérifier

1. Vérifie **Instance Type: Free**, puis lance **Deploy Web Service**.
2. Attends que Render affiche **Live**. Regarde les journaux si le déploiement échoue.
3. Ouvre **l’URL réellement attribuée par Render** en haut de la page du service. Elle se termine généralement par `.onrender.com` ; ne déduis pas le nom exact à partir de celui du dépôt.
4. Va sur `/connexion` et utilise l’e-mail et le mot de passe définis dans `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
5. Vérifie que `/admin` affiche ton tableau de bord.
6. **Après cette première connexion réussie**, retourne dans **Environment**, supprime `ADMIN_PASSWORD` et `ADMIN_EMAIL`, puis sauvegarde et redéploie. Le propriétaire est déjà dans Neon : il est conservé et son mot de passe n’est pas remplacé au redémarrage. Conserve `DATABASE_URL`.
7. Depuis une fenêtre privée, crée un compte candidat de test avec une adresse distincte, puis envoie une candidature. Contrôle son affichage dans l’administration.
8. Effectue un déploiement manuel et vérifie que le compte et le dossier sont toujours présents. Ne procède à des admissions/tirages de test que si tu souhaites réellement consommer ces places : ils sont définitifs dans cette version.

**Tu peux partager ici l’URL publique Render pour obtenir de l’aide. Ne partage pas `DATABASE_URL`, le mot de passe, les cookies ni les paramètres privés.**

### Les anciennes données de l’aperçu Arena

Un nouveau projet Neon démarre avec une nouvelle base. Les comptes éventuellement créés dans SQLite pendant les essais Arena ne sont **pas copiés automatiquement**. Le fichier local n’est pas supprimé. Si ces données doivent être conservées, il faudra préparer un transfert contrôlé avant d’ouvrir les inscriptions publiques ; ne mélange pas deux cohortes de tirages.

## 5. Ce qui reste volontairement optionnel

### Récupération du mot de passe

Les comptes, la connexion et les candidatures fonctionnent sans fournisseur d’e-mails. En revanche, **« Mot de passe oublié » reste indisponible tant que l’envoi n’est pas configuré**.

Render Free bloque les ports SMTP `25`, `465` et `587`. Le code permet donc aussi un envoi HTTPS via Resend, avec les variables privées `RESEND_API_KEY` et `MAIL_FROM`. Cela exige un expéditeur/domaine autorisé par le fournisseur et le respect de ses conditions et quotas. Acheter un domaine n’est pas une condition pour lancer cette première version du site ; n’active rien de payant pour cette étape. Si aucun expéditeur approprié n’est disponible gratuitement, laisse la récupération désactivée pour les essais. Nous choisirons ensuite une solution d’authentification/e-mail adaptée avant une collecte publique durable.

Hors Render Free, la configuration SMTP historique reste possible. Les liens sont valables 30 minutes, à usage unique et changent le mot de passe en invalidant les anciennes sessions. Ne distribue jamais un lien de récupération publiquement.

### Domaine personnalisé

Le domaine attribué au service suffit pour tester. Aucun achat de domaine n’est nécessaire. Si un domaine personnalisé est ajouté plus tard, configure `PUBLIC_ORIGIN` avec son URL HTTPS exacte, sans chemin, pour les liens d’e-mail et le contrôle d’origine.

## 6. Limites du gratuit

- Render Free se met en veille après 15 minutes d’inactivité ; une première visite peut demander environ une minute de réveil.
- L’offre dispose de quotas d’heures, de trafic et de compilation ; un dépassement peut suspendre le service ou les builds. Si un moyen de paiement est ajouté, vérifier les éventuels suppléments et plafonds avant d’activer une option.
- Neon Free a ses propres quotas de stockage, calcul et réseau. Choisir cette offre ne garantit ni disponibilité illimitée ni service 24 h/24.
- Le point `/healthz` ne fait pas de requête en base, et aucun minuteur ne maintient Neon artificiellement actif. Les données restent en base lorsque le calcul est en veille.
- Pas de surveillance par requêtes artificielles pour contourner les politiques de veille.
- Il faut définir une sauvegarde/export indépendant et vérifier la restauration : base persistante ne signifie pas sauvegarde illimitée.
- Le serveur 3D multijoueur Android devra faire l’objet d’un hébergement et de tests distincts.
- Avant collecte publique : compléter les mentions de confidentialité (responsable/contact, conservation, suppression), les règles d’âge et les autorisations sur les ressources visuelles. Une configuration d’hébergement ne règle pas ces questions.

Documentation des limites :
- <https://render.com/docs/free>
- <https://neon.com/pricing>

## 7. Dépannage rapide

| Symptôme | Vérification |
|---|---|
| `vite: not found` pendant le build | Utiliser la commande avec `npm ci --include=dev` |
| Le code du site n’apparaît pas | Vérifier la branche `arena/01a08158-matchly-project` |
| Démarrage interrompu | Vérifier les noms des variables, les identifiants du rôle Neon, le projet actif et les paramètres administrateur du premier démarrage |
| Erreur `28P01` | Mot de passe/identifiants PostgreSQL invalides : recopier la connexion Neon dans Render |
| Erreur `ENOTFOUND` / `ETIMEDOUT` | Hôte Neon incorrect ou problème réseau ; ne pas désactiver TLS pour contourner l’erreur |
| Impossible de créer le propriétaire | Adresse déjà utilisée par un joueur, ou variables ADMIN_* invalides ; ne pas essayer de se donner le rôle admin via le formulaire public |
| Administration inaccessible | Se connecter avec le compte créé au démarrage, pas un compte candidat |
| URL publique lente au premier accès | Attendre le réveil du service gratuit et vérifier ensuite son état Render |
| Mot de passe oublié indisponible | Normal sans fournisseur d’e-mail configuré |
| Réponse `403 Origine non autorisée` | Vérifier `PUBLIC_ORIGIN` si défini ; utiliser le domaine actuel du service |

Pour demander de l’aide, copie uniquement l’erreur utile des journaux et masque les secrets et les adresses privées.


## Prochain lot réseau 0.11 — ne pas confondre sources et APK vérifiée

Le service Node existant reçoit WSS `/api/game/village` sur **le même port** que le site. Aucun second service, port public ou secret n’est nécessaire. Déploiement manuel sur la branche existante, après validation complète du lot et mise à jour de son lien de téléchargement. La 0.10 reste actuellement l’APK proposée.

La salle est en mémoire dans **un seul processus** ; ne pas multiplier les instances en supposant qu’elles partagent la présence. Redémarrage/déploiement → reconnexion au point d’arrivée, mission personnelle conservée en base. Pas de base de positions ni de chat. Revalidation d’accès uniquement tant qu’il y a des participants, aucun appel Neon à vide. Gratuit ne veut pas dire disponibilité permanente ou trafic illimité. [Protocole, quotas, tests et limites](VILLAGE_PARTAGE.md).
