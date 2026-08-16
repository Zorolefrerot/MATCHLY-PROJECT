"use strict";

/**
 * MERDI BOT — Bot Facebook Messenger
 * Bibliothèque : @dongdev/fca-unofficial (v4.x)
 * Hébergement  : Render (Web Service, Node)
 *
 * Démarrage : npm start
 *
 * Sécurité :
 *   - l'AppState provient de FB_APPSTATE (prioritaire) ou de account.txt ;
 *   - aucun cookie / token n'est journalisé ni envoyé sur Messenger.
 */

const http = require("http");

const login = require("@dongdev/fca-unofficial");

const config = require("./config/config");
const logger = require("./utils/logger");
const helpers = require("./utils/helpers");
const auth = require("./utils/auth");
const permissions = require("./utils/permissions");
const commandHandler = require("./handlers/commandHandler");
const eventHandler = require("./handlers/eventHandler");

/* ------------------------------------------------------------------ *
 * État global du bot (jamais de secret ici)
 * ------------------------------------------------------------------ */
const state = {
  connected: false,
  connecting: false,
  userID: null,
  authSource: null,
  connectedAt: null,
  reconnects: 0,
  lastError: null,
  stopping: false
};

let api = null;
let mqttListener = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

/* ------------------------------------------------------------------ *
 * 1) Serveur HTTP (obligatoire sur Render : il faut écouter $PORT)
 * ------------------------------------------------------------------ */
function startHttpServer() {
  const server = http.createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];

    if (url === "/health" || url === "/healthz") {
      // `status` reflète la santé du service HTTP (toujours "online" tant que le
      // process répond) : c'est ce que Render surveille via le Health Check.
      // L'état de la session Messenger est exposé séparément dans `messenger`.
      const payload = {
        status: "online",
        messenger: state.connected ? "connected" : state.connecting ? "connecting" : "disconnected",
        bot: config.botName,
        version: config.version,
        connected: state.connected,
        uptime: Math.floor(helpers.uptimeMs() / 1000),
        commands: commandHandler.commands.size,
        reconnects: state.reconnects
      };
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url === "/status") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          status: state.connected ? "online" : "offline",
          uptimeSeconds: Math.floor(helpers.uptimeMs() / 1000),
          commandsLoaded: commandHandler.commands.size,
          eventsReceived: eventHandler.stats.received,
          commandsExecuted: commandHandler.stats.executed,
          reconnects: state.reconnects
        })
      );
      return;
    }

    if (url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("🤖 Messenger Bot Online\nBot Messenger opérationnel.\n");
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  });

  server.on("error", (err) => {
    logger.error("HTTP server error:", helpers.stringifyError(err));
  });

  server.listen(config.http.port, config.http.host, () => {
    logger.info(`HTTP server listening on port ${config.http.port}.`);
  });

  return server;
}

/* ------------------------------------------------------------------ *
 * 2) Chargement des commandes et des événements
 * ------------------------------------------------------------------ */
function loadModules() {
  logger.info("Loading commands...");
  const commandCount = commandHandler.loadCommands();
  logger.info(`${commandCount} commands loaded.`);

  logger.info("Loading events...");
  const eventCount = eventHandler.loadEvents();
  logger.info(`${eventCount} event listeners loaded.`);
}

/* ------------------------------------------------------------------ *
 * 3) Connexion Messenger
 * ------------------------------------------------------------------ */
function loginAsync(credentials, options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, resolvedApi) => {
      if (settled) return;
      settled = true;
      if (err) reject(err instanceof Error ? err : new Error(helpers.stringifyError(err)));
      else resolve(resolvedApi);
    };

    try {
      const maybePromise = login(credentials, options, done);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(
          (ctx) => done(null, ctx && ctx.api ? ctx.api : ctx),
          (err) => done(err)
        );
      }
    } catch (err) {
      done(err);
    }
  });
}

async function connect() {
  if (state.connecting || state.stopping) return;
  state.connecting = true;

  let credentials;
  try {
    logger.info("Loading Facebook session...");
    const loaded = auth.loadAppState();
    state.authSource = loaded.source;
    logger.info(
      `Session source: ${loaded.source} (${loaded.cookieCount} cookies).` // aucune valeur affichée
    );
    credentials = { appState: loaded.appState };
  } catch (err) {
    state.connecting = false;
    state.lastError = err.message;
    logger.error("Messenger authentication failed.");
    logger.error(err.message);
    if (err.hint) logger.error(`Astuce : ${err.hint}`);
    scheduleReconnect();
    return;
  }

  logger.info("Connecting to Messenger...");

  try {
    api = await loginAsync(credentials, { ...config.fcaOptions });
  } catch (err) {
    state.connecting = false;
    state.connected = false;
    state.lastError = helpers.stringifyError(err);
    logger.error("Messenger connection failed.");
    logger.error(helpers.stringifyError(err));
    logger.error(
      `Vérifie que l'AppState est valide et non expiré (variable ${config.appStateEnvVar} ou fichier account.txt).`
    );
    scheduleReconnect();
    return;
  }

  if (!api || typeof api.listenMqtt !== "function") {
    state.connecting = false;
    logger.error("Messenger connection failed: API indisponible.");
    scheduleReconnect();
    return;
  }

  try {
    // `setOptions` n'accepte qu'un sous-ensemble d'options : on filtre pour
    // éviter les avertissements « Unrecognized option » de la librairie.
    const RUNTIME_OPTIONS = [
      "online",
      "selfListen",
      "selfListenEvent",
      "listenEvents",
      "listenTyping",
      "updatePresence",
      "forceLogin",
      "autoMarkRead",
      "autoReconnect",
      "emitReady",
      "userAgent",
      "proxy"
    ];
    const runtimeOptions = {};
    for (const key of RUNTIME_OPTIONS) {
      if (config.fcaOptions[key] !== undefined) runtimeOptions[key] = config.fcaOptions[key];
    }
    api.setOptions(runtimeOptions);
  } catch (_err) {
    /* non bloquant */
  }

  try {
    state.userID = typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : null;
  } catch (_err) {
    state.userID = null;
  }

  state.connected = true;
  state.connecting = false;
  state.connectedAt = Date.now();
  state.lastError = null;
  reconnectAttempts = 0;

  logger.info("Messenger connection established.");
  if (state.userID) logger.info(`Bot UID: ${state.userID}`);
  logger.info(`Prefix: ${config.prefix} | Admin: ${config.adminUID}`);

  // Sauvegarde best effort de l'AppState rafraîchi (ignorée si FB_APPSTATE est utilisée)
  auth.persistAppState(api);

  attachApiEvents();
  startListening();
}

/** Écoute les événements de cycle de vie émis par la bibliothèque. */
function attachApiEvents() {
  if (!api || typeof api.on !== "function") return;

  const relog = (label) => {
    logger.warn(`${label} — tentative de reconnexion.`);
    handleDisconnection(label);
  };

  try {
    api.on("sessionExpired", () => relog("Session Facebook expirée"));
    api.on("checkpoint", () => {
      logger.error("Checkpoint Facebook détecté : le compte demande une vérification manuelle.");
      state.connected = false;
    });
    api.on("loginBlocked", () => {
      logger.error("Connexion bloquée par Facebook.");
      state.connected = false;
    });
    api.on("rateLimit", () => logger.warn("Limite de requêtes Facebook atteinte."));
    api.on("networkError", () => logger.warn("Erreur réseau signalée par la bibliothèque."));
    api.on("autoLoginSuccess", () => logger.info("Reconnexion automatique réussie."));
    api.on("autoLoginFailed", () => relog("Échec de la reconnexion automatique"));
  } catch (_err) {
    /* l'émetteur peut être absent selon la version */
  }
}

/** Démarre l'écoute MQTT et branche le dispatcher d'événements. */
function startListening() {
  stopListening();

  try {
    mqttListener = api.listenMqtt(async (err, event) => {
      if (err) {
        logger.error("Erreur d'écoute Messenger :", helpers.stringifyError(err));
        handleDisconnection("Écoute MQTT interrompue");
        return;
      }
      if (!event) return;

      if (event.type === "ready") {
        logger.info("Messenger realtime (MQTT) ready.");
        return;
      }
      if (event.type === "stop_listen" || event.type === "account_inactive") {
        handleDisconnection(`Événement ${event.type}`);
        return;
      }

      try {
        await eventHandler.dispatch({
          api,
          event,
          state,
          config,
          logger,
          helpers,
          permissions,
          commands: commandHandler,
          events: eventHandler
        });
      } catch (dispatchError) {
        logger.error("Erreur de dispatch :", helpers.stringifyError(dispatchError));
      }
    });

    if (mqttListener && typeof mqttListener.on === "function") {
      mqttListener.on("error", (err) => {
        logger.error("Erreur MQTT :", helpers.stringifyError(err));
      });
    }

    logger.info("Listening for Messenger events...");
  } catch (err) {
    logger.error("Impossible de démarrer l'écoute Messenger :", helpers.stringifyError(err));
    handleDisconnection("Échec du démarrage de l'écoute");
  }
}

/** Arrête proprement l'écoute MQTT en cours. */
function stopListening() {
  if (!mqttListener) return;
  try {
    if (typeof mqttListener.stopListening === "function") mqttListener.stopListening();
    else if (typeof mqttListener.stopListeningAsync === "function") {
      Promise.resolve(mqttListener.stopListeningAsync()).catch(() => {});
    } else if (typeof mqttListener === "function") {
      mqttListener();
    }
  } catch (_err) {
    /* non bloquant */
  }
  mqttListener = null;
}

/* ------------------------------------------------------------------ *
 * 4) Reconnexion automatique (backoff exponentiel + jitter)
 * ------------------------------------------------------------------ */
function handleDisconnection(reason) {
  if (state.stopping) return;
  if (!state.connected && state.connecting) return;

  state.connected = false;
  state.lastError = reason;
  logger.warn(`Connexion Messenger perdue : ${reason}`);
  stopListening();
  scheduleReconnect();
}

function scheduleReconnect() {
  if (state.stopping || reconnectTimer) return;
  if (!config.reconnect.enabled) {
    logger.error("Reconnexion désactivée : le bot reste hors ligne.");
    return;
  }

  const { maxAttempts, initialDelayMs, maxDelayMs } = config.reconnect;
  if (maxAttempts > 0 && reconnectAttempts >= maxAttempts) {
    logger.error(`Nombre maximal de tentatives atteint (${maxAttempts}). Abandon.`);
    return;
  }

  reconnectAttempts += 1;
  const backoff = Math.min(initialDelayMs * 2 ** (reconnectAttempts - 1), maxDelayMs);
  const jitter = Math.floor(Math.random() * 1000);
  const delay = backoff + jitter;

  logger.info(
    `Nouvelle tentative de connexion dans ${Math.round(delay / 1000)} s (essai n°${reconnectAttempts}).`
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    state.reconnects += 1;
    try {
      await connect();
    } catch (err) {
      logger.error("Échec de la reconnexion :", helpers.stringifyError(err));
      scheduleReconnect();
    }
  }, delay);

  if (typeof reconnectTimer.unref === "function") reconnectTimer.unref();
}

/* ------------------------------------------------------------------ *
 * 5) Robustesse : aucune erreur ne doit tuer le processus
 * ------------------------------------------------------------------ */
function installGlobalGuards() {
  process.on("uncaughtException", (err) => {
    logger.error("Exception non capturée :", helpers.stringifyError(err));
    if (err && err.stack) logger.debug(logger.redact(err.stack));
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Rejet de promesse non géré :", helpers.stringifyError(reason));
  });

  const shutdown = (signal) => {
    if (state.stopping) return;
    state.stopping = true;
    logger.info(`Signal ${signal} reçu — arrêt du bot...`);
    stopListening();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    setTimeout(() => process.exit(0), 500).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

/* ------------------------------------------------------------------ *
 * 6) Démarrage
 * ------------------------------------------------------------------ */
async function main() {
  logger.info("Starting Messenger bot...");
  logger.info("Loading configuration...");
  logger.info(
    `Bot: ${config.botName} | Version: ${config.version} | Node: ${process.version}`
  );

  installGlobalGuards();
  loadModules();

  // Le serveur HTTP démarre en premier : Render détecte le port immédiatement,
  // même si la connexion Messenger prend du temps ou échoue.
  startHttpServer();

  await connect();
}

main().catch((err) => {
  logger.error("Échec du démarrage :", helpers.stringifyError(err));
  // On ne quitte pas : le serveur HTTP doit rester disponible pour Render.
});
