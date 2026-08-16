"use strict";

/**
 * /time — date et heure courantes.
 */

module.exports = {
  name: "time",
  aliases: ["heure", "date"],
  category: "general",
  description: "Date et heure",
  usage: "/time",
  admin: false,

  async execute({ config, helpers, reply }) {
    const now = new Date();

    const lines = [
      "🕒 DATE ET HEURE",
      "",
      `📍 Local (${config.timezone}) :`,
      helpers.formatDate(now, config.timezone),
      "",
      "🌍 UTC :",
      helpers.formatDate(now, "UTC"),
      "",
      `⏳ Horodatage : ${now.getTime()}`
    ];

    await reply(lines.join("\n"));
  }
};
