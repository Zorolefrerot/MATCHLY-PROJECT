"use strict";

/**
 * /broadcast — diffuse un message dans les conversations récentes.
 * Réservé à l'administrateur.
 */

module.exports = {
  name: "broadcast",
  aliases: ["diffusion", "bc"],
  category: "admin",
  description: "Diffusion d'un message",
  usage: "/broadcast <message>",
  admin: true,
  cooldown: 10000,

  async execute({ api, rawArgs, config, helpers, logger, reply }) {
    const message = String(rawArgs || "").trim();
    if (!message) {
      await reply(`ℹ️ Utilisation : ${config.prefix}broadcast <message>`);
      return;
    }

    let threads;
    try {
      threads = await helpers.callApi(api, "getThreadList", 50, null, ["INBOX"]);
    } catch (err) {
      await reply(`⚠️ Impossible de récupérer les conversations : ${helpers.stringifyError(err)}`);
      return;
    }

    const targets = (Array.isArray(threads) ? threads : [])
      .filter((thread) => thread && thread.threadID && thread.canReply !== false)
      .slice(0, config.broadcast.maxThreads);

    if (!targets.length) {
      await reply("⚠️ Aucune conversation disponible pour la diffusion.");
      return;
    }

    await reply(`📢 Diffusion en cours vers ${targets.length} conversation(s)…`);

    const payload = `📢 ANNONCE — ${config.botName}\n\n${message}`;
    let success = 0;
    let failed = 0;

    for (const thread of targets) {
      const ok = await helpers.safeSend(api, payload, thread.threadID);
      if (ok) success += 1;
      else failed += 1;
      await helpers.sleep(config.broadcast.delayMs);
    }

    logger.info(`Diffusion terminée : ${success} succès, ${failed} échec(s).`);
    await reply(`✅ Diffusion terminée.\n📨 Envoyés : ${success}\n⚠️ Échecs : ${failed}`);
  }
};
