import { randomBytes } from "node:crypto";
import {
  digest,
  hashPassword,
  verifyPassword,
  transaction,
  mapAllocationSeats,
} from "./store.js";

// Irreversible removal of access and player data; retain an anonymous ID so
// historical audit references can never be reassigned to a new person.
export async function removeAcceptedAccount(
  db,
  actor,
  sessionToken,
  userId,
  body,
) {
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !body ||
    Object.keys(body).sort().join(",") !==
      "confirmation,password,releasePlace" ||
    body.releasePlace !== true ||
    typeof body.confirmation !== "string" ||
    body.confirmation.length > 50 ||
    typeof body.password !== "string" ||
    body.password.length > 128
  )
    throw new Error(
      "Confirme le personnage, la libération de sa place et ton mot de passe administrateur.",
    );
  // Expensive verification outside the lock, followed by a password/session recheck inside it.
  const owner = await db
    .prepare("SELECT password,role FROM users WHERE id=?")
    .get(actor);
  if (owner?.role !== "admin" || !verifyPassword(body.password, owner.password))
    throw new Error("Confirmation administrateur incorrecte.");
  return transaction(db, async () => {
    const current = await db
      .prepare(
        "SELECT u.password FROM users u JOIN sessions s ON s.user_id=u.id WHERE u.id=? AND u.role='admin' AND s.token=? AND s.expires>?",
      )
      .get(actor, digest(sessionToken || ""), Date.now());
    if (current?.password !== owner.password || userId === actor)
      throw new Error("Session administrateur invalide. Reconnecte-toi.");
    if (
      await db
        .prepare("SELECT user_id FROM deleted_accounts WHERE user_id=?")
        .get(userId)
    )
      return { deleted: true, alreadyDeleted: true };
    const target = await db
      .prepare(
        "SELECT u.role,a.status,a.character FROM users u JOIN applications a ON a.user_id=u.id WHERE u.id=?",
      )
      .get(userId);
    if (target?.role !== "player" || target.status !== "accepted")
      throw new Error("Seul un compte joueur accepté peut être supprimé ici.");
    if (body.confirmation !== target.character)
      throw new Error(
        "Recopie exactement le nom du personnage pour confirmer.",
      );
    await mapAllocationSeats(db);
    for (const table of [
      "sessions",
      "game_sessions",
      "resets",
      "welcome_missions",
      "character_appearances",
      "allocation_seats",
      "allocations",
      "applications",
    ])
      await db.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(userId);
    const now = new Date().toISOString();
    await db
      .prepare("INSERT INTO deleted_accounts(user_id,deleted_at) VALUES (?,?)")
      .run(userId, now);
    await db
      .prepare("UPDATE users SET name=?,email=?,password=? WHERE id=?")
      .run(
        "Compte supprimé",
        `removed-${userId}-${randomBytes(16).toString("hex")}@deleted.invalid`,
        hashPassword(randomBytes(32).toString("hex")),
        userId,
      );
    await db
      .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
      .run(
        actor,
        "account_deleted",
        userId,
        JSON.stringify({ placeReleased: true, playerDataRemoved: true }),
      );
    return { deleted: true, alreadyDeleted: false };
  });
}
