"use strict";

/**
 * /echo — répète le texte fourni.
 */

module.exports = {
  name: "echo",
  aliases: ["repeat"],
  category: "utilitaires",
  description: "Répéter un texte",
  usage: "/echo <texte>",
  admin: false,

  async execute({ rawArgs, config, reply }) {
    const text = String(rawArgs || "").trim();
    if (!text) {
      await reply(`ℹ️ Utilisation : ${config.prefix}echo <texte>`);
      return;
    }
    await reply(`🔁 ${text}`);
  }
};
