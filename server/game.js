import { randomBytes } from "node:crypto";
import { digest, hashPassword, verifyPassword, transaction } from "./store.js";

// Versioned cosmetic IDs from the prototype, never equipment or combat data.
export const appearanceLimits = Object.freeze({
  model: 2,
  hair: 4,
  hair_color: 8,
  eyes: 6,
  skin: 6,
  top: 3,
  top_color: 8,
  bottom: 3,
  bottom_color: 8,
});
export function validAppearance(value) {
  return (
    value &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    Object.keys(value).length === Object.keys(appearanceLimits).length &&
    Object.entries(appearanceLimits).every(
      ([key, count]) =>
        Object.hasOwn(value, key) &&
        Number.isInteger(value[key]) &&
        value[key] >= 0 &&
        value[key] < count,
    )
  );
}
const fail = (status, code, message) =>
  Object.assign(new Error(message), { status, gameCode: code });
const TTL = 2 * 60 * 60 * 1000;

export function installGameRoutes(app, db, limit) {
  const dummy = hashPassword(randomBytes(24).toString("hex"));
  const guard = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error.gameCode)
        res
          .status(error.status)
          .json({ code: error.gameCode, error: error.message });
      else next(error);
    }
  };
  async function profile(userId) {
    const row = await db
      .prepare(
        `SELECT u.id,u.role,a.character,a.status,l.clan,l.affinity,l.mokuton
      FROM users u LEFT JOIN applications a ON a.user_id=u.id
      LEFT JOIN allocations l ON l.user_id=u.id WHERE u.id=?`,
      )
      .get(userId);
    if (!row || row.role !== "player")
      throw fail(
        403,
        "PLAYER_REQUIRED",
        "Le compte propriétaire ne consomme pas de place. Utilise un compte joueur admis.",
      );
    if (row.status !== "accepted")
      throw fail(
        403,
        "ADMISSION_REQUIRED",
        "Ta candidature doit être acceptée sur le site.",
      );
    if (!row.clan)
      throw fail(
        409,
        "ALLOCATION_REQUIRED",
        "Effectue d’abord ton attribution unique dans ton espace sur le site.",
      );
    const saved = await db
      .prepare(
        "SELECT appearance,revision FROM character_appearances WHERE user_id=?",
      )
      .get(userId);
    return {
      protocol: 1,
      character: {
        id: row.id,
        name: row.character,
        clan: row.clan,
        affinity: row.affinity,
        mokuton: Boolean(row.mokuton),
        rank: "Genin",
        village: "Konoha",
      },
      schemaVersion: 1,
      appearance: saved ? JSON.parse(saved.appearance) : null,
      revision: saved?.revision || 0,
    };
  }
  async function authenticate(req) {
    // Deliberately independent of website cookies and administrator sessions.
    const token = /^Bearer ([a-f0-9]{64})$/.exec(
      req.get("authorization") || "",
    )?.[1];
    if (!token)
      throw fail(401, "SESSION_REQUIRED", "Reconnecte-toi dans l’application.");
    const session = await db
      .prepare("SELECT user_id FROM game_sessions WHERE token=? AND expires>?")
      .get(digest(token), Date.now());
    if (!session)
      throw fail(
        401,
        "SESSION_EXPIRED",
        "La session a expiré. Reconnecte-toi.",
      );
    return session.user_id;
  }
  app.use("/api/game", (req, res, next) => {
    if (process.env.NODE_ENV === "production" && !req.secure)
      return res
        .status(403)
        .json({
          code: "HTTPS_REQUIRED",
          error: "Connexion HTTPS obligatoire.",
        });
    next();
  });
  app.post(
    "/api/game/login",
    limit,
    guard(async (req, res) => {
      const { email, password } = req.body || {};
      if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" ||
        password.length > 128
      )
        throw fail(400, "INVALID_LOGIN", "Identifiants invalides.");
      const user = await db
        .prepare("SELECT id,password FROM users WHERE email=?")
        .get(email.trim().toLowerCase());
      const valid = verifyPassword(password, user?.password || dummy);
      if (!user || !valid)
        throw fail(401, "INVALID_LOGIN", "E-mail ou mot de passe incorrect.");
      const token = randomBytes(32).toString("hex");
      const expires = Date.now() + TTL;
      const data = await transaction(db, async () => {
        // Password may have been reset while the hash was checked outside the lock.
        const current = await db
          .prepare("SELECT password FROM users WHERE id=?")
          .get(user.id);
        if (current?.password !== user.password)
          throw fail(
            401,
            "INVALID_LOGIN",
            "Reconnecte-toi avec tes identifiants actuels.",
          );
        const data = await profile(user.id);
        await db
          .prepare("DELETE FROM game_sessions WHERE user_id=? OR expires<?")
          .run(user.id, Date.now());
        await db
          .prepare(
            "INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)",
          )
          .run(digest(token), user.id, expires);
        return data;
      });
      res.json({ token, expiresAt: expires, profile: data });
    }),
  );
  app.get(
    "/api/game/profile",
    guard(async (req, res) => {
      const data = await transaction(db, async () =>
        profile(await authenticate(req)),
      );
      res.json(data);
    }),
  );
  app.put(
    "/api/game/appearance",
    limit,
    guard(async (req, res) => {
      const body = req.body || {};
      if (
        Object.keys(body).sort().join(",") !==
          "appearance,expectedRevision,schemaVersion" ||
        body.schemaVersion !== 1 ||
        !Number.isSafeInteger(body.expectedRevision) ||
        body.expectedRevision < 0 ||
        body.expectedRevision >= 2147483647 ||
        !validAppearance(body.appearance)
      )
        throw fail(
          400,
          "INVALID_APPEARANCE",
          "Apparence ou version invalide. Mets à jour l’application.",
        );
      const data = await transaction(db, async () => {
        const userId = await authenticate(req);
        const current = await profile(userId); // Admission is rechecked on EVERY write.
        if (current.revision !== body.expectedRevision)
          throw fail(
            409,
            "APPEARANCE_CONFLICT",
            "Une version plus récente existe. Actualise ton personnage avant de modifier son apparence.",
          );
        await db
          .prepare(
            `INSERT INTO character_appearances(user_id,appearance,revision,updated) VALUES (?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET appearance=excluded.appearance,revision=excluded.revision,updated=excluded.updated`,
          )
          .run(
            userId,
            JSON.stringify(body.appearance),
            current.revision + 1,
            new Date().toISOString(),
          );
        return profile(userId);
      });
      res.json(data);
    }),
  );
  app.post(
    "/api/game/logout",
    guard(async (req, res) => {
      const token = /^Bearer ([a-f0-9]{64})$/.exec(
        req.get("authorization") || "",
      )?.[1];
      if (token)
        await db
          .prepare("DELETE FROM game_sessions WHERE token=?")
          .run(digest(token));
      res.json({ ok: true });
    }),
  );
}
