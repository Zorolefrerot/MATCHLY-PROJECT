"use strict";

/**
 * Écouteur des réactions (message_reaction).
 *
 * Comportement : si l'administrateur réagit avec 🗑️ / ❌ à un message envoyé
 * par le bot, celui-ci retire (unsend) son message.
 */

const logger = require("../utils/logger");
const helpers = require("../utils/helpers");
const permissions = require("../utils/permissions");

const DELETE_REACTIONS = ["🗑️", "🗑", "❌", "✖️"];

module.exports = {
  name: "message_reaction",
  types: ["message_reaction"],
  description: "Réagit aux réactions ajoutées sur les messages.",

  async handle(context) {
    const { api, event, state } = context;
    if (!event || !event.reaction) return;

    logger.debug(`Réaction ${event.reaction} de ${event.userID} sur ${event.messageID}`);

    if (!DELETE_REACTIONS.includes(event.reaction)) return;
    if (!permissions.isAdmin(event.userID)) return;

    // Le bot ne peut retirer que ses propres messages.
    const botID = state && state.userID ? String(state.userID) : null;
    if (botID && String(event.senderID) !== botID) return;

    try {
      await helpers.callApi(api, "unsendMessage", event.messageID);
      logger.info("Message retiré à la demande de l'administrateur.");
    } catch (err) {
      logger.warn("Impossible de retirer le message :", helpers.stringifyError(err));
    }
  }
};
