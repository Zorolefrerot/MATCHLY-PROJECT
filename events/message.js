"use strict";

/**
 * Écouteur des messages entrants : transmet au gestionnaire de commandes.
 */

const commandHandler = require("../handlers/commandHandler");

module.exports = {
  name: "message",
  types: ["message", "message_reply"],
  description: "Traite les messages entrants et déclenche les commandes.",

  async handle(context) {
    const { event } = context;
    if (!event || typeof event.body !== "string") return;
    if (!event.body.trim()) return;

    await commandHandler.handleMessage(context);
  }
};
