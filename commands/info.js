"use strict";

/**
 * /info — informations générales sur le bot.
 */

const os = require("os");

module.exports = {
  name: "info",
  aliases: ["bot", "about"],
  category: "general",
  description: "Informations du bot",
  usage: "/info",
  admin: false,

  async execute({ config, commands, helpers, state, reply }) {
    const lines = [
      `🤖 ${config.botName}`,
      "",
      `📦 Version      : ${config.version}`,
      `⌨️ Préfixe      : ${config.prefix}`,
      `🧩 Commandes    : ${commands.commands.size}`,
      `🌍 Langue       : ${config.language}`,
      `🕒 Uptime       : ${helpers.formatDuration(helpers.uptimeMs())}`,
      `🖥️ Node.js      : ${process.version}`,
      `💾 Mémoire      : ${helpers.formatBytes(process.memoryUsage().rss)}`,
      `☁️ Plateforme   : ${process.env.RENDER ? "Render" : `${os.platform()} ${os.arch()}`}`,
      `📚 Bibliothèque : @dongdev/fca-unofficial`,
      `👑 Admin        : ${config.adminUID}`,
      `🔌 Connexion    : ${state && state.connected ? "active" : "en cours"}`
    ];

    await reply(lines.join("\n"));
  }
};
