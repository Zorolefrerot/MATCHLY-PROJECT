"use strict";

/**
 * Fonctions utilitaires partagées par les commandes et les handlers.
 */

const config = require("../config/config");

/** Instant de démarrage du processus. */
const START_TIME = Date.now();

/** Millisecondes écoulées depuis le démarrage. */
function uptimeMs() {
  return Date.now() - START_TIME;
}

/** Formate une durée en texte français : « 1 j 3 h 12 min 5 s ». */
function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const parts = [];
  if (days) parts.push(`${days} j`);
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  parts.push(`${seconds} s`);
  return parts.join(" ");
}

/** Formate des octets en Mo lisibles. */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "n/a";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

/** Date/heure locale formatée en français. */
function formatDate(date = new Date(), timezone = config.timezone) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: timezone
    }).format(date);
  } catch (_err) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "medium"
    }).format(date);
  }
}

/** Pause asynchrone. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Tronque un texte trop long (limite Messenger ~20000 caractères). */
function truncate(text, max = 1900) {
  const value = String(text ?? "");
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

/**
 * Promisifie une méthode de l'API FCA qui utilise callback(err, data).
 * Certaines méthodes renvoient déjà une Promise : on gère les deux cas.
 */
function callApi(api, method, ...args) {
  return new Promise((resolve, reject) => {
    if (!api || typeof api[method] !== "function") {
      reject(new Error(`Méthode API indisponible : ${method}`));
      return;
    }

    let settled = false;
    const done = (err, data) => {
      if (settled) return;
      settled = true;
      if (err) reject(err instanceof Error ? err : new Error(stringifyError(err)));
      else resolve(data);
    };

    let maybePromise;
    try {
      maybePromise = api[method](...args, done);
    } catch (err) {
      done(err);
      return;
    }

    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.then(
        (data) => done(null, data),
        (err) => done(err)
      );
    }
  });
}

/**
 * Envoi d'un message.
 * Signature réelle de la bibliothèque :
 *   sendMessage(msg, threadID, callback, replyToMessageID)
 */
function sendMessage(api, message, threadID, replyToMessageID) {
  return new Promise((resolve, reject) => {
    if (!api || typeof api.sendMessage !== "function") {
      reject(new Error("Méthode API indisponible : sendMessage"));
      return;
    }

    let settled = false;
    const done = (err, data) => {
      if (settled) return;
      settled = true;
      if (err) reject(err instanceof Error ? err : new Error(stringifyError(err)));
      else resolve(data);
    };

    let maybePromise;
    try {
      maybePromise = replyToMessageID
        ? api.sendMessage(truncate(message), threadID, done, replyToMessageID)
        : api.sendMessage(truncate(message), threadID, done);
    } catch (err) {
      done(err);
      return;
    }

    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.then(
        (data) => done(null, data),
        (err) => done(err)
      );
    }
  });
}

/** Envoi de message sûr (ne lève jamais, retombe sur un envoi sans citation). */
async function safeSend(api, message, threadID, replyToMessageID) {
  try {
    await sendMessage(api, message, threadID, replyToMessageID);
    return true;
  } catch (_err) {
    if (!replyToMessageID) return false;
    try {
      await sendMessage(api, message, threadID);
      return true;
    } catch (_err2) {
      return false;
    }
  }
}

/** Transforme une erreur inconnue en texte lisible (sans secret). */
function stringifyError(err) {
  if (!err) return "Erreur inconnue";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    if (err.error) return String(err.error);
    if (err.errorSummary) return String(err.errorSummary);
    if (err.message) return String(err.message);
    try {
      return JSON.stringify(err);
    } catch (_e) {
      return "Erreur non sérialisable";
    }
  }
  return String(err);
}

/** Découpe la ligne de commande en arguments (gère les guillemets). */
function parseArgs(input) {
  const matches = String(input || "").match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((token) => token.replace(/^["']|["']$/g, ""));
}

/** Première lettre en majuscule. */
function capitalize(text) {
  const value = String(text || "");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Extrait le premier UID mentionné dans un événement Messenger. */
function firstMention(event) {
  if (!event || !event.mentions) return null;
  const ids = Object.keys(event.mentions);
  return ids.length ? ids[0] : null;
}

module.exports = {
  START_TIME,
  uptimeMs,
  formatDuration,
  formatBytes,
  formatDate,
  sleep,
  truncate,
  callApi,
  sendMessage,
  safeSend,
  stringifyError,
  parseArgs,
  capitalize,
  firstMention
};
