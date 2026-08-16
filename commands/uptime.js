"use strict";

/**
 * /uptime — temps de fonctionnement du bot.
 */

module.exports = {
  name: "uptime",
  aliases: ["up"],
  category: "general",
  description: "Temps de fonctionnement",
  usage: "/uptime",
  admin: false,

  async execute({ helpers, state, reply }) {
    const lines = [
      "⏱️ TEMPS DE FONCTIONNEMENT",
      "",
      `🚀 Bot      : ${helpers.formatDuration(helpers.uptimeMs())}`,
      `🖥️ Processus : ${helpers.formatDuration(process.uptime() * 1000)}`,
      `📅 Démarré le : ${helpers.formatDate(new Date(helpers.START_TIME))}`
    ];

    if (state && state.connectedAt) {
      lines.push(`🔌 Connecté depuis : ${helpers.formatDuration(Date.now() - state.connectedAt)}`);
    }
    if (state && state.reconnects) {
      lines.push(`♻️ Reconnexions : ${state.reconnects}`);
    }

    await reply(lines.join("\n"));
  }
};
