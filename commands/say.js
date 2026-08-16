"use strict";

/**
 * /say — envoie le texte dans la conversation (sans citation).
 */

module.exports = {
  name: "say",
  aliases: ["dis"],
  category: "utilitaires",
  description: "Envoyer un texte",
  usage: "/say <texte>",
  admin: false,

  async execute({ rawArgs, config, send, reply }) {
    const text = String(rawArgs || "").trim();
    if (!text) {
      await reply(`ℹ️ Utilisation : ${config.prefix}say <texte>`);
      return;
    }
    await send(text);
  }
};
