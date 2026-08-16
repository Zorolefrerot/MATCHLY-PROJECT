"use strict";

/**
 * /profil — informations sur un profil Facebook.
 */

module.exports = {
  name: "profil",
  aliases: ["profile", "user"],
  category: "general",
  description: "Informations du profil",
  usage: "/profil [@mention | UID]",
  admin: false,

  async execute({ api, event, args, helpers, reply }) {
    const mentioned = helpers.firstMention(event);
    let targetID = mentioned;

    if (!targetID && args[0] && /^\d{5,}$/.test(args[0])) targetID = args[0];
    if (!targetID && event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    if (!targetID) targetID = event.senderID;

    let info;
    try {
      info = await helpers.callApi(api, "getUserInfo", targetID);
    } catch (err) {
      await reply(`⚠️ Impossible de récupérer ce profil : ${helpers.stringifyError(err)}`);
      return;
    }

    const data = info && (info[targetID] || info[String(targetID)]);
    if (!data) {
      await reply("⚠️ Profil introuvable ou inaccessible.");
      return;
    }

    const genderMap = { 1: "Féminin", 2: "Masculin" };
    const lines = [
      "👤 PROFIL",
      "",
      `📛 Nom        : ${data.name || "inconnu"}`,
      `🆔 UID        : ${targetID}`,
      `🔗 Profil     : ${data.profileUrl || `https://facebook.com/${targetID}`}`,
      `⚧ Genre      : ${genderMap[data.gender] || data.gender || "non précisé"}`,
      `🤝 Ami        : ${data.isFriend ? "oui" : "non"}`,
      `📄 Type       : ${data.type || "user"}`
    ];

    if (data.vanity) lines.push(`✨ Pseudo URL : ${data.vanity}`);
    if (data.alternateName) lines.push(`🏷️ Autre nom  : ${data.alternateName}`);

    await reply(lines.join("\n"));
  }
};
