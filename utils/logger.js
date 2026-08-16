"use strict";

/**
 * Logger minimaliste et sûr.
 *
 * - Format lisible dans les logs Render : [INFO] message
 * - Masque automatiquement tout ce qui ressemble à un cookie / AppState / token.
 */

const SECRET_ENV_KEYS = [
  "FB_APPSTATE",
  "APPSTATE",
  "FB_COOKIE",
  "COOKIE",
  "FB_EMAIL",
  "FB_PASSWORD"
];

/** Motifs de secrets à masquer dans toute sortie de log. */
const SECRET_PATTERNS = [
  /\b(c_user|xs|fr|datr|sb|spin|presence|i_user|wd|dpr|m_pixel_ratio)\s*=\s*[^;\s"']+/gi,
  /"(key|name)"\s*:\s*"(c_user|xs|fr|datr|sb|i_user)"/gi,
  /\bEAA[A-Za-z0-9]{20,}\b/g, // access tokens Facebook
  /\baccess_token"?\s*[:=]\s*"?[A-Za-z0-9._-]{10,}/gi,
  /\bfb_dtsg"?\s*[:=]\s*"?[A-Za-z0-9:._-]{10,}/gi
];

/** Valeurs secrètes réelles (issues de l'environnement) à ne jamais imprimer. */
function collectEnvSecrets() {
  const secrets = [];
  for (const key of SECRET_ENV_KEYS) {
    const value = process.env[key];
    if (value && String(value).length >= 8) secrets.push(String(value));
  }
  return secrets;
}

/** Remplace toute occurrence de secret par [REDACTED]. */
function redact(input) {
  let text = typeof input === "string" ? input : safeStringify(input);
  if (!text) return text;

  for (const secret of collectEnvSecrets()) {
    if (text.includes(secret)) text = text.split(secret).join("[REDACTED]");
  }
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, "[REDACTED]");
  }
  return text;
}

/** Stringify tolérant aux références circulaires. */
function safeStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value !== "object") return String(value);

  const seen = new WeakSet();
  try {
    return JSON.stringify(
      value,
      (key, val) => {
        if (
          typeof key === "string" &&
          /appstate|cookie|token|password|secret|fb_dtsg|xs|c_user/i.test(key)
        ) {
          return "[REDACTED]";
        }
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      },
      0
    );
  } catch (_err) {
    return "[Unserializable]";
  }
}

/** Horodatage ISO court. */
function timestamp() {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

function format(level, args) {
  const body = args.map((arg) => redact(arg)).join(" ");
  return `[${level}] ${body}`;
}

const logger = {
  info(...args) {
    console.log(format("INFO", args));
  },
  warn(...args) {
    console.warn(format("WARN", args));
  },
  error(...args) {
    console.error(format("ERROR", args));
  },
  debug(...args) {
    if (process.env.DEBUG === "1" || process.env.DEBUG === "true") {
      console.log(format("DEBUG", args));
    }
  },
  /** Log avec horodatage (utile pour les évènements récurrents). */
  stamped(level, ...args) {
    console.log(`[${level}] ${timestamp()} ${args.map(redact).join(" ")}`);
  },
  redact,
  safeStringify
};

module.exports = logger;
