"use strict";

/**
 * Gestion des permissions.
 * L'administrateur principal est défini dans config/config.js (UID 100065927401614).
 */

const config = require("../config/config");

/** Vrai si l'UID correspond à l'administrateur principal. */
function isMainAdmin(senderID) {
  return String(senderID) === String(config.adminUID);
}

/** Vrai si l'UID fait partie des administrateurs autorisés. */
function isAdmin(senderID) {
  const id = String(senderID);
  return config.admins.some((admin) => String(admin) === id);
}

/**
 * Vérifie l'accès à une commande.
 * @param {object} command  Commande chargée (avec .admin / .adminOnly)
 * @param {string} senderID UID de l'expéditeur
 * @returns {{ allowed: boolean, reason: string|null }}
 */
function checkAccess(command, senderID) {
  const adminOnly = Boolean(command && (command.admin || command.adminOnly));
  if (!adminOnly) return { allowed: true, reason: null };
  if (isAdmin(senderID)) return { allowed: true, reason: null };
  return { allowed: false, reason: config.messages.notAdmin };
}

module.exports = {
  isAdmin,
  isMainAdmin,
  checkAccess,
  DENIED_MESSAGE: config.messages.notAdmin
};
