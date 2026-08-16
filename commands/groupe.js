"use strict";

/**
 * /groupe — informations sur la conversation courante.
 */

module.exports = {
  name: "groupe",
  aliases: ["group", "thread"],
  category: "general",
  description: "Informations du groupe",
  usage: "/groupe",
  admin: false,

  async execute({ api, event, helpers, reply }) {
    let info;
    try {
      info = await helpers.callApi(api, "getThreadInfo", event.threadID);
    } catch (err) {
      await reply(`⚠️ Impossible de lire les informations : ${helpers.stringifyError(err)}`);
      return;
    }

    if (!info) {
      await reply("⚠️ Aucune information disponible pour cette conversation.");
      return;
    }

    const participants = Array.isArray(info.participantIDs) ? info.participantIDs.length : 0;
    const admins = Array.isArray(info.adminIDs) ? info.adminIDs.length : 0;

    const lines = [
      "💬 INFORMATIONS DE LA CONVERSATION",
      "",
      `📛 Nom          : ${info.threadName || info.name || "(sans nom)"}`,
      `🆔 ID           : ${event.threadID}`,
      `👥 Type         : ${info.isGroup ? "Groupe" : "Discussion privée"}`,
      `🙋 Participants : ${participants}`,
      `👑 Admins       : ${admins}`,
      `💌 Messages     : ${info.messageCount ?? "n/a"}`,
      `😀 Emoji        : ${info.emoji || "par défaut"}`,
      `🎨 Couleur      : ${info.color || "par défaut"}`,
      `🔇 Sourdine     : ${info.muteUntil ? "oui" : "non"}`
    ];

    if (info.approvalMode !== undefined) {
      lines.push(`✅ Approbation  : ${info.approvalMode ? "activée" : "désactivée"}`);
    }

    await reply(lines.join("\n"));
  }
};
