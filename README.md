# 🤖 MERDI BOT — Bot Facebook Messenger (Node.js + Render)

Bot Messenger complet écrit en Node.js, basé sur
[`@dongdev/fca-unofficial`](https://www.npmjs.com/package/@dongdev/fca-unofficial) (v4.x),
prêt à être déployé sur **Render** en tant que *Web Service*.

- **Préfixe** : `/`
- **Administrateur principal** : `100065927401614`
- **Langue** : français
- **Authentification** : AppState Facebook (c3c) via `FB_APPSTATE` ou `account.txt`
- **Démarrage** : `npm start`

> ⚠️ **Avertissement** : cette bibliothèque émule une session de navigateur connectée.
> Son utilisation peut enfreindre les conditions d'utilisation de Meta et entraîner une
> restriction du compte. Utilise un compte dédié, à tes risques et périls.

---

## 📁 Structure du projet

```
.
├── index.js                 # Point d'entrée : serveur HTTP + connexion Messenger + reconnexion
├── package.json             # "start": "node index.js"
├── render.yaml              # Blueprint Render (optionnel)
├── README.md
├── .gitignore               # ignore node_modules/, .env, *.log
├── .env.example             # modèle de variables d'environnement
├── account.txt              # AppState local (modèle vide, versionné)
│
├── config/
│   └── config.js            # configuration centrale (surchargée par l'environnement)
│
├── commands/                # chargées automatiquement au démarrage
│   ├── help.js              # menu généré à partir de ce dossier
│   ├── ping.js
│   ├── info.js
│   ├── uid.js
│   ├── profil.js
│   ├── uptime.js
│   ├── time.js
│   ├── groupe.js
│   ├── echo.js
│   ├── say.js
│   ├── admin.js             # 👑 admin
│   ├── status.js            # 👑 admin
│   └── broadcast.js         # 👑 admin
│
├── handlers/
│   ├── commandHandler.js    # scan de commands/, permissions, cooldown, try/catch
│   └── eventHandler.js      # scan de events/, dispatch des événements MQTT
│
├── events/
│   ├── message.js           # messages entrants -> commandes
│   └── reaction.js          # réactions (🗑️ de l'admin = retirer le message du bot)
│
└── utils/
    ├── auth.js              # chargement/normalisation de l'AppState (FB_APPSTATE > account.txt)
    ├── logger.js            # logs [INFO]/[WARN]/[ERROR] + masquage automatique des secrets
    ├── permissions.js       # vérification senderID === UID admin
    └── helpers.js           # utilitaires (durées, dates, envoi de messages, promisification)
```

---

## 🚀 Déploiement sur Render — étape par étape

### Étape 1 — Créer un repository GitHub

Sur [github.com/new](https://github.com/new), crée un dépôt (public ou privé), par exemple `merdi-bot`.

### Étape 2 — Mettre le projet sur GitHub

```bash
git init
git add .
git commit -m "Bot Messenger prêt pour Render"
git branch -M main
git remote add origin https://github.com/<ton-compte>/merdi-bot.git
git push -u origin main
```

> ⚠️ **Important** : `account.txt` est **versionné** (il est livré comme modèle vide, sans aucun secret).
> Si tu y colles ton vrai AppState puis fais un `git push`, **tes cookies Facebook se retrouvent sur GitHub**.
>
> - En production, laisse-le vide et utilise la variable d'environnement `FB_APPSTATE` (étape 5).
> - Si tu veux quand même y mettre ton AppState en local, re-masque-le d'abord :
>
> ```bash
> # décommente la ligne "account.txt" dans .gitignore, puis :
> git rm --cached account.txt
> git commit -m "Ne plus suivre account.txt"
> ```
>
> `.env` et `node_modules/` restent ignorés dans tous les cas.

### Étape 3 — Créer un Web Service sur Render

1. Va sur [dashboard.render.com](https://dashboard.render.com).
2. **New +** → **Web Service**.
3. Connecte ton compte GitHub et sélectionne le dépôt.

### Étape 4 — Configurer le service

| Champ | Valeur |
|---|---|
| **Environment / Runtime** | `Node` |
| **Region** | au choix (ex. Frankfurt) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` *(recommandé)* |
| **Instance Type** | Free ou payant |

### Étape 5 — Ajouter l'AppState dans Render

Onglet **Environment** → **Add Environment Variable** :

| Key | Value |
|---|---|
| `FB_APPSTATE` | ton AppState (tableau JSON **sur une seule ligne**, ou sa version base64) |

Exemple de valeur :

```json
[{"key":"datr","value":"...","domain":".facebook.com","path":"/"},{"key":"c_user","value":"...","domain":".facebook.com","path":"/"},{"key":"xs","value":"...","domain":".facebook.com","path":"/"}]
```

**Variante — Secret File** (utile si la valeur est très longue) :

1. Onglet **Environment** → **Secret Files** → nom du fichier : `account.txt`
   (Render le monte dans `/etc/secrets/account.txt`).
2. Ajoute la variable `FB_APPSTATE_FILE` = `/etc/secrets/account.txt`.

### Étape 6 — Déployer

Clique sur **Create Web Service** (ou **Manual Deploy → Deploy latest commit**).
Le bot se connecte automatiquement. Logs attendus :

```
[INFO] Starting Messenger bot...
[INFO] Loading configuration...
[INFO] Loading commands...
[INFO] 13 commands loaded.
[INFO] Loading events...
[INFO] 2 event listeners loaded.
[INFO] Loading Facebook session...
[INFO] Session source: variable d'environnement FB_APPSTATE (7 cookies).
[INFO] Connecting to Messenger...
[INFO] HTTP server listening on port 10000.
[INFO] Messenger connection established.
[INFO] Listening for Messenger events...
```

En cas de problème d'authentification :

```
[ERROR] Messenger connection failed.
```

> 💡 **Déploiement en 1 clic** : le fichier `render.yaml` est fourni.
> Render → **New +** → **Blueprint** → sélectionne le dépôt, puis renseigne `FB_APPSTATE`.

---

## 🖥️ Serveur HTTP & Health check

Render exige qu'un Web Service écoute le port fourni par la variable `PORT`.
Le serveur HTTP est intégré au bot et démarre **avant** la connexion Messenger,
donc un échec d'authentification ne fait jamais échouer le déploiement.

```js
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => { ... });
```

| Route | Réponse |
|---|---|
| `GET /` | `🤖 Messenger Bot Online` / `Bot Messenger opérationnel.` |
| `GET /health` | `{"status":"online","messenger":"connected","bot":"MERDI BOT",...}` |
| `GET /status` | statistiques JSON (uptime, commandes, événements, reconnexions) |

---

## 🔐 Authentification Facebook

Ordre de priorité appliqué par `utils/auth.js` :

1. **`FB_APPSTATE`** (variable d'environnement Render) ;
2. **`FB_APPSTATE_FILE`** (chemin d'un Secret File Render) ;
3. **`account.txt`** (fichier local, développement — versionné et vide par défaut).

Formats acceptés (détection automatique) :

- tableau JSON de cookies : `[{"key":"c_user","value":"..."}, ...]` ;
- format `name`/`value` : `[{"name":"c_user","value":"..."}, ...]` ;
- objet enveloppe : `{"appState":[...]}` ou `{"cookies":[...]}` ;
- chaîne brute : `c_user=...; xs=...; datr=...` ;
- n'importe lequel des formats ci-dessus **encodé en base64**.

Cookies obligatoires : **`c_user`** et **`xs`** (contrôlés au démarrage, message d'erreur explicite sinon).

### Garanties de sécurité

- Le contenu de `account.txt` / `FB_APPSTATE` n'est **jamais** journalisé (le logger masque
  automatiquement cookies, `fb_dtsg`, `access_token` et la valeur exacte des variables secrètes).
- Il n'est **jamais** envoyé sur Messenger (aucune commande n'y accède).
- Aucun cookie n'est écrit en dur dans le code.
- `.env` et les bases locales sont dans `.gitignore`. ⚠️ `account.txt` est versionné (modèle vide) :
  voir l'avertissement de l'étape 2 avant d'y écrire un vrai AppState.
- ⚠️ Le disque de Render est **éphémère** : le rafraîchissement de `account.txt` est désactivé
  dès que `FB_APPSTATE` est utilisée. Utilise toujours la variable d'environnement en production.

---

## 💻 Utilisation en local

```bash
git clone https://github.com/<ton-compte>/merdi-bot.git
cd merdi-bot
npm install

# Option A : coller l'AppState dans account.txt
# Option B : cp .env.example .env  puis renseigner FB_APPSTATE

npm start
```

Le bot écoute alors sur <http://localhost:3000>.

> Note : la dépendance transitive `sqlite3` (cache interne de la bibliothèque) peut échouer à
> compiler sur certaines machines. Ce n'est pas bloquant : le bot fonctionne sans le cache.
> Si nécessaire : `npm install --ignore-scripts`.

---

## 💬 Commandes

Toutes les commandes utilisent le préfixe `/`.

### 📌 Général

| Commande | Description |
|---|---|
| `/help [commande]` | Affiche le menu (généré automatiquement) ou le détail d'une commande |
| `/ping` | Teste le bot et affiche la latence |
| `/info` | Informations du bot (version, uptime, mémoire, plateforme) |
| `/uid` | Affiche ton UID, celui d'une mention ou d'un message cité |
| `/profil [@mention\|UID]` | Informations d'un profil Facebook |
| `/uptime` | Temps de fonctionnement |
| `/time` | Date et heure (locale + UTC) |
| `/groupe` | Informations de la conversation |

### 🛠️ Utilitaires

| Commande | Description |
|---|---|
| `/echo <texte>` | Répète le texte (en citation) |
| `/say <texte>` | Envoie le texte dans la conversation |

### 👑 Administrateur

Réservées à l'UID `100065927401614`. Les autres utilisateurs reçoivent :
`⛔ Cette commande est réservée à l'administrateur.`

| Commande | Description |
|---|---|
| `/admin` | Panneau des commandes administrateur |
| `/status` | État technique complet du bot |
| `/broadcast <message>` | Diffuse un message dans les conversations récentes |

---

## ➕ Ajouter une commande

Crée simplement un fichier dans `commands/`. Aucun changement dans `index.js` n'est nécessaire :
`commands/bonjour.js` crée automatiquement `/bonjour`, et le menu `/help` l'affiche.

```js
// commands/bonjour.js
"use strict";

module.exports = {
  name: "bonjour",              // optionnel (par défaut : nom du fichier)
  aliases: ["salut"],           // optionnel
  category: "general",          // general | utilitaires | admin
  description: "Dire bonjour",
  usage: "/bonjour",
  admin: false,                 // true => réservé à l'administrateur
  cooldown: 1500,               // optionnel (ms)

  async execute({ api, event, args, rawArgs, reply, send, config, helpers, logger }) {
    await reply(`👋 Bonjour ! Ton UID est ${event.senderID}.`);
  }
};
```

Contexte fourni à `execute()` :

| Clé | Description |
|---|---|
| `api` | API plate de `@dongdev/fca-unofficial` (`sendMessage`, `getThreadInfo`, …) |
| `event` | Événement MQTT brut (`threadID`, `senderID`, `body`, `mentions`, …) |
| `args` / `rawArgs` | Arguments découpés (guillemets gérés) / texte brut après la commande |
| `reply(texte)` | Répond en citant le message |
| `send(texte, [threadID])` | Envoie un message sans citation |
| `state` | État du bot (connexion, UID, reconnexions) |
| `commands` / `events` | Handlers (statistiques, liste des commandes) |
| `config`, `logger`, `helpers`, `permissions` | Modules internes |

### Ajouter un écouteur d'événement

Un fichier dans `events/` avec `name` (ou `types`) et `handle(context)` :

```js
// events/presence.js
module.exports = {
  name: "presence",
  async handle({ event, logger }) {
    logger.debug(`Présence : ${event.userID}`);
  }
};
```

Types disponibles : `message`, `message_reply`, `message_reaction`, `message_unsend`,
`typ`, `read`, `presence`, `event`, `*` (tous).

---

## 🛡️ Gestion des erreurs et reconnexion

- Chaque commande s'exécute dans un `try/catch` : une erreur ne fait **jamais** planter le bot,
  l'utilisateur reçoit `⚠️ Une erreur est survenue lors de l'exécution de cette commande.`
- `uncaughtException` et `unhandledRejection` sont interceptés et journalisés.
- La perte de la connexion MQTT, une session expirée ou un `account_inactive` déclenchent une
  **reconnexion automatique** avec backoff exponentiel (5 s → 10 s → 20 s … plafonné à 5 min, + jitter).
- Les signaux `SIGINT` / `SIGTERM` (redéploiement Render) provoquent un arrêt propre.
- Le serveur HTTP reste disponible même si Messenger est déconnecté : Render ne marque pas
  le service en échec, et `/health` reste `online` (Render ne redémarre pas le service), le champ `messenger` indiquant l'état réel de la session.

---

## ⚙️ Variables d'environnement

Toutes sont facultatives sauf `FB_APPSTATE` (ou `account.txt`). Voir `.env.example`.

| Variable | Défaut | Description |
|---|---|---|
| `FB_APPSTATE` | — | AppState Facebook (**prioritaire**) |
| `FB_APPSTATE_FILE` | — | Chemin d'un Secret File contenant l'AppState |
| `PORT` | `3000` | Port HTTP (fourni automatiquement par Render) |
| `BOT_NAME` | `MERDI BOT` | Nom affiché |
| `PREFIX` | `/` | Préfixe des commandes |
| `ADMIN_UID` | `100065927401614` | UID de l'administrateur principal |
| `ADMIN_UIDS` | — | Administrateurs supplémentaires (séparés par des virgules) |
| `TZ_BOT` | `Africa/Kinshasa` | Fuseau horaire de `/time` |
| `SELF_LISTEN` | `false` | Écouter ses propres messages |
| `AUTO_MARK_READ` | `false` | Marquer les messages comme lus |
| `APPEAR_ONLINE` | `false` | Apparaître en ligne |
| `RECONNECT_ENABLED` | `true` | Reconnexion automatique |
| `RECONNECT_INITIAL_DELAY` | `5000` | Délai initial (ms) |
| `RECONNECT_MAX_DELAY` | `300000` | Délai maximal (ms) |
| `RECONNECT_MAX_ATTEMPTS` | `0` | 0 = illimité |
| `COMMAND_COOLDOWN` | `1500` | Anti-spam par utilisateur (ms) |
| `BROADCAST_MAX_THREADS` | `20` | Conversations max pour `/broadcast` |
| `BROADCAST_DELAY` | `900` | Pause entre deux envois (ms) |
| `DEBUG` | `0` | `1` pour activer les logs `[DEBUG]` |

---

## 🩺 Dépannage

| Symptôme | Cause probable / solution |
|---|---|
| `Messenger authentication failed` + `Le fichier account.txt est vide` | Définis `FB_APPSTATE` dans Render, ou remplis `account.txt` en local |
| `AppState incomplet : cookie(s) manquant(s) « xs »` | Réexporte l'AppState depuis un compte réellement connecté |
| `Messenger connection failed` | AppState expiré/révoqué → réexporte-le et mets à jour `FB_APPSTATE` |
| `Checkpoint Facebook détecté` | Facebook demande une vérification : connecte-toi manuellement au compte, puis réexporte l'AppState |
| Le service Render redémarre en boucle | Vérifie que le service est bien de type **Web Service** et que le Start Command est `npm start` |
| Le bot ne répond pas | Regarde `/health` : `"messenger":"disconnected"` = session invalide. Vérifie aussi le préfixe `/` |
| `Database initialization error` (sqlite3) au démarrage | Message interne de la bibliothèque (cache optionnel), sans impact sur le bot |
| Le plan gratuit se met en veille | Render Free suspend les services inactifs : utilise un ping externe (UptimeRobot) sur `/health`, ou un plan payant |

---

## 📄 Licence

MIT — projet fourni à des fins éducatives. L'utilisation de bots non officiels sur Messenger
relève de ta seule responsabilité.
