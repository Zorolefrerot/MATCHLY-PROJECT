"use strict";

/**
 * /uid — affiche un UID (le tien, celui d'une mention, ou d'un message cité).
 */

module.exports = {
  name: "uid",
  aliases: ["id"],
  category: "general",
  description: "Afficher un UID",
  usage: "/uid [@mention]",
  admin: false,

  async execute({ event, helpers, reply }) {
    const mentioned = helpers.firstMention(event);

    if (mentioned) {
      const name = event.mentions[mentioned]
        ? String(event.mentions[mentioned]).replace(/^@/, "")
        : "Utilisateur";
      await reply(`🆔 UID de ${name} : ${mentioned}`);
      return;
    }

    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      await reply(`🆔 UID de l'auteur du message cité : ${event.messageReply.senderID}`);
      return;
    }

    await reply(`🆔 Ton UID : ${event.senderID}\n💬 UID de la conversation : ${event.threadID}`);
  }
};
