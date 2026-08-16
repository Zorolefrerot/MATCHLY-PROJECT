"use strict";

/**
 * Chargement automatique et exécution des commandes.
 *
 * Chaque fichier .js placé dans ./commands est chargé au démarrage.
 * Ajouter commands/bonjour.js suffit à créer /bonjour, sans toucher index.js.
 *
 * Format d'une commande :
 *   module.exports = {
 *     name: "ping",                // optionnel (défaut : nom du fichier)
 *     aliases: ["p"],              // optionnel
 *     description: "Tester le bot",
 *     category: "general",         // general | utilitaires | admin
 *     usage: "/ping",              // optionnel
 *     admin: false,                // true => réservé à l'administrateur
 *     cooldown: 1500,              // optionnel (ms)
 *     execute: async ({ api, event, args, ... }) => { ... }
 *   };
 */

const fs = require("fs");
const path = require("path");

const config = require("../config/config");
const logger = require("../utils/logger");
const permissions = require("../utils/permissions");
const helpers = require("../utils/helpers");

class CommandHandler {
  constructor() {
    /** @type {Map<string, object>} nom -> commande */
    this.commands = new Map();
    /** @type {Map<string, string>} alias -> nom */
    this.aliases = new Map();
    /** @type {Map<string, number>} userID -> timestamp dernière commande */
    this.cooldowns = new Map();
    this.stats = { executed: 0, failed: 0, denied: 0 };
  }

  /** Charge (ou recharge) toutes les commandes du dossier commands/. */
  loadCommands() {
    this.commands.clear();
    this.aliases.clear();

    const dir = config.paths.commands;
    if (!fs.existsSync(dir)) {
      logger.warn(`Dossier des commandes introuvable : ${dir}`);
      return 0;
    }

    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".js") && !file.startsWith("_"));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        delete require.cache[require.resolve(fullPath)];
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const loaded = require(fullPath);
        const command = loaded && loaded.default ? loaded.default : loaded;

        if (!command || typeof command.execute !== "function") {
          logger.warn(`Commande ignorée (execute manquant) : ${file}`);
          continue;
        }

        const name = String(command.name || path.basename(file, ".js")).toLowerCase();
        command.name = name;
        command.category = String(command.category || "general").toLowerCase();
        command.description = command.description || "Aucune description.";
        command.usage = command.usage || `${config.prefix}${name}`;
        command.admin = Boolean(command.admin || command.adminOnly);
        command.aliases = Array.isArray(command.aliases) ? command.aliases : [];
        command.file = file;

        if (this.commands.has(name)) {
          logger.warn(`Commande dupliquée ignorée : ${name} (${file})`);
          continue;
        }

        this.commands.set(name, command);
        for (const alias of command.aliases) {
          const key = String(alias).toLowerCase();
          if (!this.aliases.has(key) && !this.commands.has(key)) {
            this.aliases.set(key, name);
          }
        }
      } catch (err) {
        logger.error(`Échec du chargement de la commande ${file} :`, helpers.stringifyError(err));
      }
    }

    return this.commands.size;
  }

  /** Récupère une commande par nom ou alias. */
  get(name) {
    if (!name) return null;
    const key = String(name).toLowerCase();
    if (this.commands.has(key)) return this.commands.get(key);
    if (this.aliases.has(key)) return this.commands.get(this.aliases.get(key));
    return null;
  }

  /** Liste des commandes groupées par catégorie (utilisée par /help). */
  byCategory() {
    const groups = new Map();
    for (const command of this.commands.values()) {
      const category = command.admin ? "admin" : command.category || "general";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(command);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }
    return groups;
  }

  /** Anti-spam simple par utilisateur. */
  isOnCooldown(senderID, command) {
    const delay = Number.isFinite(command.cooldown) ? command.cooldown : config.cooldownMs;
    if (!delay || permissions.isAdmin(senderID)) return false;

    const now = Date.now();
    const last = this.cooldowns.get(senderID) || 0;
    if (now - last < delay) return true;
    this.cooldowns.set(senderID, now);

    // Nettoyage périodique de la table
    if (this.cooldowns.size > 500) {
      for (const [id, ts] of this.cooldowns) {
        if (now - ts > 60000) this.cooldowns.delete(id);
      }
    }
    return false;
  }

  /**
   * Analyse un message et exécute la commande correspondante.
   * Ne lève jamais : toute erreur est capturée et journalisée.
   */
  async handleMessage(context) {
    const { api, event } = context;
    const body = typeof event.body === "string" ? event.body.trim() : "";
    if (!body || !body.startsWith(config.prefix)) return false;

    const withoutPrefix = body.slice(config.prefix.length).trim();
    if (!withoutPrefix) return false;

    const args = helpers.parseArgs(withoutPrefix);
    const commandName = String(args.shift() || "").toLowerCase();
    if (!commandName) return false;

    const command = this.get(commandName);
    if (!command) {
      await helpers.safeSend(
        api,
        config.messages.unknownCommand(commandName, config.prefix),
        event.threadID,
        event.messageID
      );
      return false;
    }

    // Permissions
    const access = permissions.checkAccess(command, event.senderID);
    if (!access.allowed) {
      this.stats.denied += 1;
      logger.info(`Accès refusé à ${config.prefix}${command.name} (UID ${event.senderID}).`);
      await helpers.safeSend(api, access.reason, event.threadID, event.messageID);
      return false;
    }

    // Cooldown
    if (this.isOnCooldown(event.senderID, command)) {
      await helpers.safeSend(api, config.messages.cooldown, event.threadID, event.messageID);
      return false;
    }

    try {
      await command.execute({
        ...context,
        args,
        argsText: args.join(" "),
        rawArgs: withoutPrefix.slice(commandName.length).trim(),
        command,
        commands: this,
        config,
        logger,
        helpers,
        permissions,
        threadID: event.threadID,
        senderID: event.senderID,
        messageID: event.messageID,
        reply: (message) => helpers.safeSend(api, message, event.threadID, event.messageID),
        send: (message, threadID = event.threadID) => helpers.safeSend(api, message, threadID)
      });
      this.stats.executed += 1;
      logger.info(`Commande exécutée : ${config.prefix}${command.name}`);
      return true;
    } catch (err) {
      this.stats.failed += 1;
      logger.error(
        `Erreur dans la commande ${config.prefix}${command.name} :`,
        helpers.stringifyError(err)
      );
      await helpers.safeSend(api, config.messages.commandError, event.threadID, event.messageID);
      return false;
    }
  }
}

module.exports = new CommandHandler();
module.exports.CommandHandler = CommandHandler;
