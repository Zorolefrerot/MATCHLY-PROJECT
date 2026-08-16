"use strict";

/**
 * Authentification Facebook.
 *
 * Priorité des sources :
 *   1. Variable d'environnement FB_APPSTATE (Render : Environment Variable ou Secret File)
 *   2. Fichier local account.txt
 *
 * Formats acceptés (c3c / AppState) :
 *   - Tableau JSON d'objets cookies : [{ "key": "c_user", "value": "..." }, ...]
 *   - Objet JSON { "appState": [...] } ou { "cookies": [...] }
 *   - Le même JSON encodé en base64
 *   - Une chaîne de cookies brute : "c_user=...; xs=...; datr=..."
 *
 * Règles de sécurité appliquées ici :
 *   - le contenu n'est JAMAIS journalisé ;
 *   - aucune valeur n'est renvoyée dans un message Messenger ;
 *   - aucun cookie n'est écrit en dur dans le code.
 */

const fs = require("fs");
const path = require("path");

const config = require("../config/config");
const logger = require("./logger");

/** Cookies indispensables à une session Messenger valide. */
const REQUIRED_COOKIES = ["c_user", "xs"];

/** Erreur d'authentification lisible. */
class AuthError extends Error {
  constructor(message, hint) {
    super(message);
    this.name = "AuthError";
    this.hint = hint || null;
  }
}

/** Retire les commentaires de type `// ...` en tête de fichier et les BOM. */
function cleanRaw(raw) {
  return String(raw)
    .replace(/^\uFEFF/, "")
    .trim();
}

/** Tente un JSON.parse sans lever d'exception. */
function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
}

/** Tente un décodage base64 -> JSON. */
function tryParseBase64JSON(text) {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(text) || text.length < 40) return null;
  try {
    const decoded = Buffer.from(text.replace(/\s+/g, ""), "base64").toString("utf8");
    return tryParseJSON(decoded);
  } catch (_err) {
    return null;
  }
}

/** Convertit une chaîne "a=1; b=2" en tableau AppState. */
function cookieStringToAppState(cookieString) {
  const pairs = cookieString
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const appState = [];
  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) continue;
    appState.push({
      key,
      value,
      domain: ".facebook.com",
      path: "/",
      hostOnly: false,
      creation: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    });
  }
  return appState;
}

/**
 * Normalise n'importe quel format supporté vers le tableau attendu par
 * @dongdev/fca-unofficial : [{ key, value, domain, path, ... }]
 */
function normalizeAppState(rawInput) {
  const raw = cleanRaw(rawInput);
  if (!raw) throw new AuthError("AppState vide.");

  let parsed = tryParseJSON(raw);
  if (!parsed) parsed = tryParseBase64JSON(raw);

  // Chaîne de cookies brute (ni JSON ni base64-JSON)
  if (!parsed) {
    if (raw.includes("=") && raw.includes("c_user")) {
      parsed = cookieStringToAppState(raw);
    } else {
      throw new AuthError(
        "Format d'AppState non reconnu (ni JSON, ni base64, ni chaîne de cookies)."
      );
    }
  }

  // Objet enveloppe { appState: [...] } / { cookies: [...] } / { session: [...] }
  if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
    const wrapped =
      parsed.appState || parsed.appstate || parsed.cookies || parsed.session || parsed.data;
    if (Array.isArray(wrapped)) {
      parsed = wrapped;
    } else if (typeof parsed.cookie === "string" || typeof parsed.Cookie === "string") {
      parsed = cookieStringToAppState(parsed.cookie || parsed.Cookie);
    } else {
      // Objet simple { c_user: "...", xs: "..." }
      const entries = Object.entries(parsed).filter(([, v]) => typeof v === "string");
      if (!entries.length) throw new AuthError("Objet AppState invalide.");
      parsed = entries.map(([key, value]) => ({
        key,
        value,
        domain: ".facebook.com",
        path: "/"
      }));
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new AuthError("AppState invalide : un tableau de cookies est attendu.");
  }

  const appState = parsed
    .map((cookie) => {
      if (!cookie || typeof cookie !== "object") return null;
      const key = cookie.key || cookie.name;
      const value = cookie.value !== undefined ? cookie.value : cookie.val;
      if (!key || value === undefined || value === null) return null;
      return {
        key: String(key),
        value: String(value),
        domain: cookie.domain || ".facebook.com",
        path: cookie.path || "/",
        hostOnly: cookie.hostOnly !== undefined ? cookie.hostOnly : false,
        secure: cookie.secure !== undefined ? cookie.secure : true,
        httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
        expirationDate: cookie.expirationDate || cookie.expires || undefined,
        creation: cookie.creation || new Date().toISOString(),
        lastAccessed: cookie.lastAccessed || new Date().toISOString()
      };
    })
    .filter(Boolean);

  if (!appState.length) {
    throw new AuthError("AppState invalide : aucun cookie exploitable trouvé.");
  }

  const keys = new Set(appState.map((cookie) => cookie.key));
  const missing = REQUIRED_COOKIES.filter((required) => !keys.has(required));
  if (missing.length) {
    throw new AuthError(
      `AppState incomplet : cookie(s) manquant(s) « ${missing.join(", ")} ».`,
      "Réexporte l'AppState depuis un compte connecté (extension c3c / FBSTATE)."
    );
  }

  return appState;
}

/**
 * Charge l'AppState selon la priorité FB_APPSTATE puis account.txt.
 * @returns {{ appState: Array, source: string, cookieCount: number, userID: string|null }}
 */
function loadAppState() {
  const envVar = config.appStateEnvVar;
  const envValue = process.env[envVar];

  // 1) Variable d'environnement (recommandé sur Render)
  if (envValue && String(envValue).trim()) {
    const appState = normalizeAppState(envValue);
    return describe(appState, `variable d'environnement ${envVar}`);
  }

  // 1-bis) Secret File Render monté sur disque (chemin donné par FB_APPSTATE_FILE)
  const secretFile = process.env.FB_APPSTATE_FILE;
  if (secretFile && fs.existsSync(secretFile)) {
    const appState = normalizeAppState(fs.readFileSync(secretFile, "utf8"));
    return describe(appState, `fichier secret ${path.basename(secretFile)}`);
  }

  // 2) Fichier local account.txt
  const accountFile = config.paths.account;
  if (!fs.existsSync(accountFile)) {
    throw new AuthError(
      `Aucun AppState trouvé : variable ${envVar} absente et fichier ${path.basename(
        accountFile
      )} introuvable.`,
      `Sur Render, ajoute la variable d'environnement ${envVar}. En local, remplis ${path.basename(
        accountFile
      )}.`
    );
  }

  const raw = fs.readFileSync(accountFile, "utf8");
  const stripped = cleanRaw(raw)
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n")
    .trim();

  if (!stripped) {
    throw new AuthError(
      `Le fichier ${path.basename(accountFile)} est vide.`,
      `Colle ton AppState (c3c) dedans, ou définis ${envVar} sur Render.`
    );
  }

  const appState = normalizeAppState(stripped);
  return describe(appState, `fichier local ${path.basename(accountFile)}`);
}

/** Construit un descripteur non sensible (aucune valeur de cookie exposée). */
function describe(appState, source) {
  const userCookie = appState.find((cookie) => cookie.key === "c_user");
  return {
    appState,
    source,
    cookieCount: appState.length,
    // c_user est l'UID public du bot : utile pour les logs, non sensible.
    userID: userCookie ? String(userCookie.value) : null
  };
}

/**
 * Sauvegarde l'AppState rafraîchi dans account.txt (best effort).
 * Sur Render le disque est éphémère : l'échec n'est jamais bloquant.
 */
function persistAppState(api) {
  try {
    if (!api || typeof api.getAppState !== "function") return false;
    // Interdit si l'AppState vient d'une variable d'environnement : on ne
    // veut pas créer un fichier secret non désiré sur le disque Render.
    if (process.env[config.appStateEnvVar]) return false;

    const fresh = api.getAppState();
    if (!Array.isArray(fresh) || !fresh.length) return false;

    fs.writeFileSync(config.paths.account, JSON.stringify(fresh, null, 2), {
      encoding: "utf8",
      mode: 0o600
    });
    logger.info("AppState local rafraîchi.");
    return true;
  } catch (_err) {
    // On ne journalise surtout pas le contenu, seulement l'échec.
    logger.warn("Impossible de rafraîchir l'AppState local (disque en lecture seule ?).");
    return false;
  }
}

module.exports = {
  AuthError,
  loadAppState,
  normalizeAppState,
  persistAppState
};
