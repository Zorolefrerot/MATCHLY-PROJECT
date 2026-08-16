"use strict";

/**
 * Chargement automatique des écouteurs d'événements (dossier events/)
 * et dispatch des événements MQTT reçus depuis Messenger.
 *
 * Format d'un événement :
 *   module.exports = {
 *     name: "message",            // type d'événement MQTT, "*" pour tout recevoir
 *     types: ["message", "message_reply"], // optionnel : plusieurs types
 *     handle: async (context) => { ... }
 *   };
 */

const fs = require("fs");
const path = require("path");

const config = require("../config/config");
const logger = require("../utils/logger");
const helpers = require("../utils/helpers");

class EventHandler {
  constructor() {
    /** @type {Map<string, object[]>} type -> écouteurs */
    this.listeners = new Map();
    this.stats = { received: 0, handled: 0, failed: 0 };
    this.lastEventAt = null;
  }

  /** Charge tous les fichiers du dossier events/. */
  loadEvents() {
    this.listeners.clear();

    const dir = config.paths.events;
    if (!fs.existsSync(dir)) {
      logger.warn(`Dossier des événements introuvable : ${dir}`);
      return 0;
    }

    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".js") && !file.startsWith("_"));

    let count = 0;
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        delete require.cache[require.resolve(fullPath)];
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const loaded = require(fullPath);
        const listener = loaded && loaded.default ? loaded.default : loaded;

        const handle = listener && (listener.handle || listener.execute);
        if (typeof handle !== "function") {
          logger.warn(`Événement ignoré (handle manquant) : ${file}`);
          continue;
        }

        const types = Array.isArray(listener.types)
          ? listener.types
          : [listener.name || path.basename(file, ".js")];

        for (const type of types) {
          const key = String(type);
          if (!this.listeners.has(key)) this.listeners.set(key, []);
          this.listeners.get(key).push({ ...listener, handle, file });
        }
        count += 1;
      } catch (err) {
        logger.error(`Échec du chargement de l'événement ${file} :`, helpers.stringifyError(err));
      }
    }

    return count;
  }

  /** Dispatch d'un événement MQTT vers les écouteurs concernés. */
  async dispatch(context) {
    const event = context.event;
    if (!event || !event.type) return;

    this.stats.received += 1;
    this.lastEventAt = Date.now();

    const listeners = [
      ...(this.listeners.get(event.type) || []),
      ...(this.listeners.get("*") || [])
    ];
    if (!listeners.length) return;

    for (const listener of listeners) {
      try {
        await listener.handle(context);
        this.stats.handled += 1;
      } catch (err) {
        this.stats.failed += 1;
        logger.error(
          `Erreur dans l'écouteur ${listener.file} (${event.type}) :`,
          helpers.stringifyError(err)
        );
      }
    }
  }
}

module.exports = new EventHandler();
module.exports.EventHandler = EventHandler;
