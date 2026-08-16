"use strict";

/**
 * /ping — teste la réactivité du bot.
 */

module.exports = {
  name: "ping",
  aliases: ["p"],
  category: "general",
  description: "Tester le bot",
  usage: "/ping",
  admin: false,

  async execute({ event, reply }) {
    const sentAt = Date.now();
    const eventTime = Number(event.timestamp) || sentAt;
    const latency = Math.max(0, sentAt - eventTime);

    await reply(`🏓 Pong !\n⚡ Latence : ${latency} ms`);
  }
};
