import { randomBytes } from "node:crypto";
import { digest, hashPassword, verifyPassword, transaction } from "./store.js";

import {
  welcomeState,
  welcomeEvents,
  advanceWelcome,
} from "./welcome-mission.js";
import {
  clanMissionState,
  clanMissionEvents,
  advanceClanMission,
  rewardForStars,
} from "./clan-mission.js";
import { secondaryStateForUser } from "./secondary-mission.js";
import { teamStateForUser } from "./team-system.js";

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
// The device session is an opaque bearer token, never a password. A remembered
// device may return without asking for the website credentials again; logout,
// password reset, account deletion and admission revocation still invalidate it.
const TTL = 30 * 24 * 60 * 60 * 1000;

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
    // Admission is enough to enter the world. If the owner has not yet
    // assigned a clan, use a neutral starter identity and let the player
    // enter Konoha immediately instead of blocking the native session.
    const saved = await db
      .prepare(
        "SELECT appearance,revision FROM character_appearances WHERE user_id=?",
      )
      .get(userId);
    const clan = row.clan || "Uchiwa";
    const clanMission = await db
      .prepare(
        "SELECT mission_id,status,score,revision,started_at,reward_claimed FROM clan_missions WHERE user_id=?",
      )
      .get(userId);
    const progress = await db
      .prepare("SELECT idrem_gold,level FROM player_progress WHERE user_id=?")
      .get(userId);
    return {
      protocol: 1,
      character: {
        id: row.id,
        name: row.character,
        clan,
        clan_id: clan
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
        affinity: row.affinity || "Chakra",
        mokuton: Boolean(row.mokuton),
        rank: "Genin",
        village: "Konoha",
      },
      schemaVersion: 1,
      appearance: saved ? JSON.parse(saved.appearance) : null,
      revision: saved?.revision || 0,
      welcomeMission: welcomeState(
        await db
          .prepare(
            "SELECT phase,visited,revision FROM welcome_missions WHERE user_id=?",
          )
          .get(userId),
      ),
      clanMission: clanMissionState(clanMission),
      secondaryMissions: await secondaryStateForUser(db, userId),
      team: await teamStateForUser(db, userId),
      progress: {
        idremGold: Number(progress?.idrem_gold || 0),
        level: Number(progress?.level || 0),
      },
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
      return res.status(403).json({
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
    "/api/game/missions/welcome/events",
    limit,
    guard(async (req, res) => {
      const body = req.body || {};
      if (
        Object.keys(body).sort().join(",") !== "event,expectedRevision" ||
        !welcomeEvents.includes(body.event) ||
        !Number.isSafeInteger(body.expectedRevision) ||
        body.expectedRevision < 0 ||
        body.expectedRevision > 5
      )
        throw fail(
          400,
          "INVALID_MISSION_EVENT",
          "Étape de mission invalide. Mets à jour l’application.",
        );
      const data = await transaction(db, async () => {
        const userId = await authenticate(req);
        await profile(userId); // Recheck admission under the same lock.
        const row = await db
          .prepare(
            "SELECT phase,visited,revision FROM welcome_missions WHERE user_id=?",
          )
          .get(userId);
        const next = advanceWelcome(row, body.event, body.expectedRevision);
        if (next)
          await db
            .prepare(
              `INSERT INTO welcome_missions(user_id,phase,visited,revision,updated) VALUES (?,?,?,?,?)
          ON CONFLICT(user_id) DO UPDATE SET phase=excluded.phase,visited=excluded.visited,revision=excluded.revision,updated=excluded.updated`,
            )
            .run(
              userId,
              next.phase,
              next.visited,
              next.revision,
              new Date().toISOString(),
            );
        return profile(userId);
      });
      res.json(data);
    }),
  );
  app.post(
    "/api/game/missions/clan/events",
    limit,
    guard(async (req, res) => {
      const body = req.body || {};
      const expectedKeys =
        body.event === "expire"
          ? "event,expectedRevision,score"
          : "event,expectedRevision";
      if (
        Object.keys(body).sort().join(",") !== expectedKeys ||
        !clanMissionEvents.includes(body.event) ||
        !Number.isSafeInteger(body.expectedRevision) ||
        body.expectedRevision < 0 ||
        body.expectedRevision > 5 ||
        (body.event === "expire" &&
          (!Number.isSafeInteger(body.score) ||
            body.score < 0 ||
            body.score > 1000000))
      )
        throw fail(
          400,
          "INVALID_CLAN_MISSION_EVENT",
          "Étape de mission de clan invalide. Mets à jour l’application.",
        );
      const data = await transaction(db, async () => {
        const userId = await authenticate(req);
        await profile(userId); // Recheck admission and the account clan on every write.
        const welcome = await db
          .prepare("SELECT phase FROM welcome_missions WHERE user_id=?")
          .get(userId);
        if (welcome?.phase !== "completed")
          throw fail(
            403,
            "CLAN_MISSION_LOCKED",
            "Termine d’abord la mission d’accueil d’Aoi.",
          );
        const row = await db
          .prepare(
            "SELECT mission_id,status,score,revision,started_at,reward_claimed FROM clan_missions WHERE user_id=?",
          )
          .get(userId);
        const next = advanceClanMission(
          row,
          body.event,
          body.expectedRevision,
          body.event === "expire" ? body.score : null,
        );
        if (next) {
          await db
            .prepare(
              `INSERT INTO clan_missions(user_id,mission_id,status,score,revision,started_at,reward_claimed,updated) VALUES (?,?,?,?,?,?,?,?)
          ON CONFLICT(user_id) DO UPDATE SET mission_id=excluded.mission_id,status=excluded.status,score=excluded.score,revision=excluded.revision,started_at=excluded.started_at,reward_claimed=excluded.reward_claimed,updated=excluded.updated`,
            )
            .run(
              userId,
              "clan_stars",
              next.status,
              next.score,
              next.revision,
              next.started_at,
              next.reward_claimed,
              new Date().toISOString(),
            );
          if (body.event === "report") {
            const reward = rewardForStars(Number(next.score));
            await db
              .prepare(
                `INSERT INTO player_progress(user_id,idrem_gold,level,updated) VALUES (?,?,?,?)
              ON CONFLICT(user_id) DO UPDATE SET idrem_gold=player_progress.idrem_gold+excluded.idrem_gold,level=CASE WHEN player_progress.level > excluded.level THEN player_progress.level ELSE excluded.level END,updated=excluded.updated`,
              )
              .run(
                userId,
                reward.idremGold,
                reward.level,
                new Date().toISOString(),
              );
            await db
              .prepare(
                "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
              )
              .run(
                userId,
                "clan_mission_reward",
                userId,
                JSON.stringify({ score: next.score, reward }),
              );
          }
        }
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
