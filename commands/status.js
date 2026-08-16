"use strict";

/**
 * /status — état technique complet du bot (administrateur uniquement).
 * Aucune donnée sensible (cookie / AppState) n'est affichée.
 */

const os = require("os");

module.exports = {
  name: "status",
  aliases: ["etat", "stats"],
  category: "admin",
  description: "État du bot",
  usage: "/status",
  admin: true,

  async execute({ config, commands, events, helpers, state, reply }) {
    const memory = process.memoryUsage();
    const load = os.loadavg()[0];

    const lines = [
      "📡 ÉTAT DU BOT",
      "",
      "— Connexion —",
      `🔌 Messenger   : ${state && state.connected ? "✅ connectée" : "❌ interrompue"}`,
      `🆔 UID du bot  : ${state && state.userID ? state.userID : "inconnu"}`,
      `🔐 Source auth : ${state && state.authSource ? state.authSource : "n/a"}`,
      `♻️ Reconnexions: ${state ? state.reconnects : 0}`,
      `⏰ Connecté depuis : ${
        state && state.connectedAt ? helpers.formatDuration(Date.now() - state.connectedAt) : "n/a"
      }`,
      "",
      "— Activité —",
      `📥 Événements reçus : ${events.stats.received}`,
      `✅ Traités          : ${events.stats.handled}`,
      `⚠️ Échecs           : ${events.stats.failed}`,
      `🧩 Commandes        : ${commands.commands.size} chargée(s)`,
      `▶️ Exécutions       : ${commands.stats.executed}`,
      `❌ Erreurs          : ${commands.stats.failed}`,
      `⛔ Refus (non-admin): ${commands.stats.denied}`,
      "",
      "— Système —",
      `🖥️ Node.js   : ${process.version}`,
      `💾 RSS       : ${helpers.formatBytes(memory.rss)}`,
      `🧠 Heap      : ${helpers.formatBytes(memory.heapUsed)} / ${helpers.formatBytes(memory.heapTotal)}`,
      `📈 Charge 1m : ${load.toFixed(2)}`,
      `⏱️ Uptime    : ${helpers.formatDuration(helpers.uptimeMs())}`,
      `🌐 Port HTTP : ${config.http.port}`,
      `☁️ Render    : ${process.env.RENDER ? "oui" : "non"}`,
      `🔑 ${config.appStateEnvVar} : ${process.env[config.appStateEnvVar] ? "définie ✅" : "absente ❌"}`
    ];

    await reply(lines.join("\n"));
  }
};
