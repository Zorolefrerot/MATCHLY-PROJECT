"use strict";

/**
 * /admin — panneau des commandes administrateur.
 * Réservé à l'UID administrateur (voir config/config.js).
 */

module.exports = {
  name: "admin",
  aliases: ["adm"],
  category: "admin",
  description: "Commandes administrateur",
  usage: "/admin",
  admin: true,

  async execute({ config, commands, reply }) {
    const adminCommands = Array.from(commands.commands.values())
      .filter((command) => command.admin)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    const lines = [
      "👑 PANNEAU ADMINISTRATEUR",
      "",
      `🆔 Administrateur principal : ${config.adminUID}`,
      `👥 Administrateurs déclarés : ${config.admins.length}`,
      "",
      "🛠️ Commandes réservées :",
      ""
    ];

    for (const command of adminCommands) {
      lines.push(`${command.usage} — ${command.description}`);
    }

    lines.push(
      "",
      `📊 Statistiques : ${commands.stats.executed} exécutée(s), ${commands.stats.failed} erreur(s), ${commands.stats.denied} refus.`
    );

    await reply(lines.join("\n"));
  }
};
