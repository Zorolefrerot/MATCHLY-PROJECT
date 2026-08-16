"use strict";

/**
 * Configuration centrale du bot.
 *
 * Toutes les valeurs peuvent être surchargées par des variables
 * d'environnement Render (aucun secret n'est écrit en dur ici).
 */

const path = require("path");

/** Convertit une variable d'environnement en booléen. */
function envBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return defaultValue;
  return ["1", "true", "yes", "on", "oui"].includes(String(raw).trim().toLowerCase());
}

/** Convertit une variable d'environnement en entier. */
function envInt(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return defaultValue;
  const parsed = parseInt(String(raw).trim(), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

/** Liste d'UID séparés par des virgules. */
function envList(name, defaultValue) {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  return String(raw)
    .split(/[,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const ROOT_DIR = path.join(__dirname, "..");

const ADMIN_UID = (process.env.ADMIN_UID || "100065927401614").trim();

const config = {
  /** Nom affiché du bot. */
  botName: process.env.BOT_NAME || "MERDI BOT",

  /** Version affichée par /info. */
  version: require("../package.json").version,

  /** Préfixe des commandes. */
  prefix: process.env.PREFIX || "/",

  /** UID de l'administrateur principal. */
  adminUID: ADMIN_UID,

  /** Liste complète des administrateurs (principal + éventuels ADMIN_UIDS). */
  admins: Array.from(new Set([ADMIN_UID, ...envList("ADMIN_UIDS", [])])),

  /** Langue des messages. */
  language: process.env.LANG_BOT || "fr",

  /** Fuseau horaire utilisé par /time et /uptime. */
  timezone: process.env.TZ_BOT || "Africa/Kinshasa",

  /** Chemins locaux. */
  paths: {
    root: ROOT_DIR,
    commands: path.join(ROOT_DIR, "commands"),
    events: path.join(ROOT_DIR, "events"),
    /** Fichier local contenant l'AppState (fallback si FB_APPSTATE est absent). */
    account: process.env.ACCOUNT_FILE
      ? path.resolve(ROOT_DIR, process.env.ACCOUNT_FILE)
      : path.join(ROOT_DIR, "account.txt")
  },

  /** Nom de la variable d'environnement prioritaire contenant l'AppState. */
  appStateEnvVar: "FB_APPSTATE",

  /** Serveur HTTP (obligatoire sur Render). */
  http: {
    port: envInt("PORT", 3000),
    host: process.env.HTTP_HOST || "0.0.0.0"
  },

  /** Options passées à @dongdev/fca-unofficial. */
  fcaOptions: {
    listenEvents: true,
    selfListen: envBool("SELF_LISTEN", false),
    autoMarkRead: envBool("AUTO_MARK_READ", false),
    autoReconnect: true,
    online: envBool("APPEAR_ONLINE", false),
    emitReady: true,
    forceLogin: envBool("FORCE_LOGIN", false),
    userAgent:
      process.env.FCA_USER_AGENT ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  },

  /** Politique de reconnexion Messenger. */
  reconnect: {
    enabled: envBool("RECONNECT_ENABLED", true),
    /** Délai initial (ms) avant une nouvelle tentative. */
    initialDelayMs: envInt("RECONNECT_INITIAL_DELAY", 5000),
    /** Délai maximal (ms). */
    maxDelayMs: envInt("RECONNECT_MAX_DELAY", 300000),
    /** Nombre maximal de tentatives (0 = illimité). */
    maxAttempts: envInt("RECONNECT_MAX_ATTEMPTS", 0)
  },

  /** Anti-spam simple : délai minimal entre 2 commandes d'un même utilisateur (ms). */
  cooldownMs: envInt("COMMAND_COOLDOWN", 1500),

  /** Limites de la commande /broadcast. */
  broadcast: {
    maxThreads: envInt("BROADCAST_MAX_THREADS", 20),
    delayMs: envInt("BROADCAST_DELAY", 900)
  },

  /** Messages réutilisables. */
  messages: {
    notAdmin: "⛔ Cette commande est réservée à l'administrateur.",
    unknownCommand: (cmd, prefix) =>
      `❓ Commande inconnue : ${prefix}${cmd}\nTape ${prefix}help pour voir la liste des commandes.`,
    commandError: "⚠️ Une erreur est survenue lors de l'exécution de cette commande.",
    cooldown: "⏳ Doucement… attends une seconde avant la prochaine commande."
  }
};

module.exports = config;
