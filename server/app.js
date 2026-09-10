import express from "express";
import { installGameRoutes } from "./game.js";
import { randomBytes } from "node:crypto";
import { recoveryAvailable, sendRecovery } from "./mailer.js";
import { isUniqueViolation } from "./database.js";
import {
  hashPassword,
  verifyPassword,
  digest,
  decide,
  allocate,
  transaction,
} from "./store.js";
import { quiz } from "./quiz.js";
export function createApp(db) {
  const getQuiz = async () => {
    const row = await db
      .prepare("SELECT value FROM settings WHERE key='quiz'")
      .get();
    return row ? JSON.parse(row.value) : quiz;
  };
  const app = express();
  app.disable("x-powered-by");
  // Process liveness only: Render health checks must not wake Neon repeatedly.
  app.get("/healthz", (req, res) => res.json({ status: "ok" }));
  app.set("trust proxy", 1);
  app.use(
    express.json({
      limit: "40kb",
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "same-origin");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      const host = req.get("host");
      if (
        req.get("sec-fetch-site") === "cross-site" ||
        (origin &&
          origin !== process.env.PUBLIC_ORIGIN &&
          new URL(origin).host !== host)
      )
        return res.status(403).json({
          error: "Origine non autorisée.",
        });
      if (!req.is("application/json"))
        return res.status(415).json({
          error: "Format JSON requis.",
        });
    }
    next();
  });
  const limits = new Map();
  // No periodic DB traffic: allow Neon to suspend while the site is idle.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, v] of limits) if (v.until < now) limits.delete(key);
  }, 60000);
  cleanup.unref();
  app.locals.cleanup = () => clearInterval(cleanup);
  const limit = (req, res, next) => {
    const key = req.ip;
    let bucket = limits.get(key);
    if (!bucket || bucket.until < Date.now()) {
      bucket = {
        count: 0,
        until: Date.now() + 15 * 60000,
      };
      limits.set(key, bucket);
    }
    if (++bucket.count > 35)
      return res.status(429).json({
        error: "Trop de tentatives. Réessaie dans 15 minutes.",
      });
    next();
  };
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  async function session(req, res, user) {
    const token = randomBytes(32).toString("hex");
    await db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    await db.prepare("DELETE FROM resets WHERE expires<?").run(Date.now());
    if (req.token)
      await db
        .prepare("DELETE FROM sessions WHERE token=?")
        .run(digest(req.token));
    await db
      .prepare("INSERT INTO sessions VALUES (?,?,?)")
      .run(digest(token), user.id, Date.now() + 7 * 86400000);
    res.cookie("iz_session", token, {
      ...cookieOptions,
      maxAge: 7 * 86400000,
    });
  }
  app.use("/api", async (req, res, next) => {
    req.token = (req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("iz_session="))
      ?.slice(11);
    if (req.token)
      req.user = await db
        .prepare(
          "SELECT u.id,u.name,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
        )
        .get(digest(req.token), Date.now());
    next();
  });
  const auth = (req, res, next) =>
    req.user
      ? next()
      : res.status(401).json({
          error: "Connecte-toi pour continuer.",
        });
  const admin = (req, res, next) =>
    req.user?.role === "admin"
      ? next()
      : res.status(403).json({
          error: "Cet espace est réservé au propriétaire.",
        });
  const validEmail = (e) =>
    typeof e === "string" &&
    e.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validPassword = (p) =>
    typeof p === "string" && p.length >= 10 && p.length <= 128;
  const publicUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  });
  installGameRoutes(app, db, limit);
  app.get("/api/info", async (req, res) =>
    res.json({
      capacity: 20,
      accepted: (
        await db
          .prepare(
            "SELECT COUNT(*) AS n FROM applications WHERE status='accepted'",
          )
          .get()
      ).n,
      resetAvailable: recoveryAvailable(),
      gameAvailable: false,
    }),
  );
  app.get("/api/quiz", async (req, res) =>
    res.json((await getQuiz()).map(({ answer, ...q }) => q)),
  );
  app.get("/api/me", async (req, res) => {
    if (!req.user)
      return res.json({
        user: null,
      });
    const application =
      (await db
        .prepare(
          "SELECT id,character,discovery,goals,motivation,story,status,message,created,updated FROM applications WHERE user_id=?",
        )
        .get(req.user.id)) || null;
    res.json({
      user: req.user,
      application,
      allocation:
        (await db
          .prepare(
            "SELECT clan,affinity,mokuton FROM allocations WHERE user_id=?",
          )
          .get(req.user.id)) || null,
    });
  });
  app.post("/api/auth/register", limit, async (req, res) => {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 30 ||
      !validEmail(email) ||
      !validPassword(password)
    )
      return res.status(400).json({
        error:
          "Choisis un pseudo de 3 à 30 caractères, un e-mail valide et un mot de passe de 10 à 128 caractères.",
      });
    try {
      const result = await db
        .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
        .run(name.trim(), email.trim().toLowerCase(), hashPassword(password));
      const user = await db
        .prepare("SELECT * FROM users WHERE id=?")
        .get(Number(result.lastInsertRowid));
      await session(req, res, user);
      res.status(201).json({
        user: publicUser(user),
      });
    } catch (e) {
      if (isUniqueViolation(e))
        return res.status(409).json({
          error:
            "Impossible de créer ce compte. Si tu es déjà inscrit, connecte-toi.",
        });
      throw e;
    }
  });
  // Dummy hash makes unknown-email and wrong-password verification comparable.
  const dummy = hashPassword(randomBytes(24).toString("hex"));
  app.post("/api/auth/login", limit, async (req, res) => {
    const { email, password } = req.body;
    if (
      !validEmail(email) ||
      typeof password !== "string" ||
      password.length > 128
    )
      return res.status(400).json({
        error: "Identifiants invalides.",
      });
    const user = await db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(email.trim().toLowerCase());
    const valid = verifyPassword(password, user?.password || dummy);
    if (!user || !valid)
      return res.status(401).json({
        error: "E-mail ou mot de passe incorrect.",
      });
    await session(req, res, user);
    res.json({
      user: publicUser(user),
    });
  });
  app.post("/api/auth/logout", async (req, res) => {
    if (req.token)
      await db
        .prepare("DELETE FROM sessions WHERE token=?")
        .run(digest(req.token));
    res.clearCookie("iz_session", cookieOptions);
    res.json({
      ok: true,
    });
  });
  app.post("/api/auth/forgot", limit, async (req, res) => {
    if (!recoveryAvailable())
      return res.status(503).json({
        error:
          "La récupération par e-mail sera disponible après configuration du service d’envoi par le propriétaire.",
      });
    if (!validEmail(req.body.email))
      return res.status(400).json({
        error: "Adresse e-mail invalide.",
      });
    const user = await db
      .prepare("SELECT id FROM users WHERE email=?")
      .get(req.body.email.trim().toLowerCase());
    if (user) {
      const token = randomBytes(32).toString("hex");
      await transaction(db, async () => {
        await db.prepare("DELETE FROM resets WHERE user_id=?").run(user.id);
        await db
          .prepare("INSERT INTO resets VALUES (?,?,?)")
          .run(digest(token), user.id, Date.now() + 30 * 60000);
      });
      try {
        await sendRecovery(req.body.email.trim(), token);
      } catch {
        await db.prepare("DELETE FROM resets WHERE token=?").run(digest(token));
        console.error("Échec de l’envoi du message de récupération.");
      }
    }
    res.json({
      message:
        "Si cette adresse correspond à un compte, un lien de récupération sera envoyé.",
    });
  });
  app.post("/api/auth/reset", limit, async (req, res) => {
    const { token, password } = req.body;
    if (
      typeof token !== "string" ||
      token.length > 128 ||
      !validPassword(password)
    )
      return res.status(400).json({
        error: "Lien ou mot de passe invalide (10 caractères minimum).",
      });
    try {
      await transaction(db, async () => {
        const reset = await db
          .prepare("SELECT * FROM resets WHERE token=? AND expires>?")
          .get(digest(token), Date.now());
        if (!reset) throw new Error("Ce lien est expiré ou déjà utilisé.");
        await db
          .prepare("UPDATE users SET password=? WHERE id=?")
          .run(hashPassword(password), reset.user_id);
        await db
          .prepare("DELETE FROM resets WHERE user_id=?")
          .run(reset.user_id);
        await db
          .prepare("DELETE FROM sessions WHERE user_id=?")
          .run(reset.user_id);
        await db
          .prepare("DELETE FROM game_sessions WHERE user_id=?")
          .run(reset.user_id);
      });
      res.json({
        ok: true,
      });
    } catch (e) {
      res.status(400).json({
        error: e.message,
      });
    }
  });
  app.post("/api/application", auth, limit, async (req, res) => {
    if (req.user.role === "admin")
      return res.status(400).json({
        error: "Le propriétaire ne consomme pas de place de joueur.",
      });
    const lengths = {
      character: [3, 50],
      discovery: [5, 500],
      goals: [20, 1500],
      motivation: [30, 2000],
      story: [30, 2000],
    };
    for (const [key, [min, max]] of Object.entries(lengths))
      if (
        typeof req.body[key] !== "string" ||
        req.body[key].trim().length < min ||
        req.body[key].length > max
      )
        return res.status(400).json({
          error: `Le champ ${key} doit contenir entre ${min} et ${max} caractères.`,
        });
    const quiz = await getQuiz();
    const answers = req.body.answers;
    if (
      !answers ||
      quiz.some(
        (q) =>
          !Number.isInteger(answers[q.id]) ||
          answers[q.id] < 0 ||
          answers[q.id] >= q.options.length,
      )
    )
      return res.status(400).json({
        error: "Réponds aux 10 questions du quiz.",
      });
    if (req.body.consent !== true)
      return res.status(400).json({
        error: "Tu dois accepter les règles de candidature.",
      });
    if (
      await db
        .prepare("SELECT id FROM applications WHERE user_id=?")
        .get(req.user.id)
    )
      return res.status(409).json({
        error: "Tu as déjà envoyé une candidature.",
      });
    const score = quiz.filter((q) => answers[q.id] === q.answer).length;
    await db
      .prepare(
        "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .run(
        req.user.id,
        ...Object.keys(lengths).map((k) => req.body[k].trim()),
        JSON.stringify(
          Object.fromEntries(quiz.map((q) => [q.id, answers[q.id]])),
        ),
        JSON.stringify(quiz),
        score,
      );
    res.status(201).json({
      ok: true,
    });
  });
  app.post("/api/allocation", auth, async (req, res) => {
    try {
      res.json(await allocate(db, req.user.id));
    } catch (e) {
      res.status(409).json({
        error: e.message,
      });
    }
  });
  app.get("/api/admin/applications", auth, admin, async (req, res) =>
    res.json(
      (
        await db
          .prepare(
            "SELECT a.*,u.name,u.email FROM applications a JOIN users u ON u.id=a.user_id ORDER BY a.created DESC,a.id DESC",
          )
          .all()
      ).map((a) => ({
        ...a,
        answers: JSON.parse(a.answers),
        quiz_snapshot: JSON.parse(a.quiz_snapshot),
      })),
    ),
  );
  app.post("/api/admin/applications/:id", auth, admin, async (req, res) => {
    if (
      !["pending", "accepted", "waitlisted", "rejected"].includes(
        req.body.status,
      ) ||
      typeof req.body.message !== "string" ||
      req.body.message.length > 2000
    )
      return res.status(400).json({
        error: "Décision invalide.",
      });
    try {
      await decide(
        db,
        req.user.id,
        Number(req.params.id),
        req.body.status,
        req.body.message.trim(),
      );
      res.json({
        ok: true,
      });
    } catch (e) {
      res.status(409).json({
        error: e.message,
      });
    }
  });
  app.get("/api/admin/quiz", auth, admin, async (req, res) =>
    res.json(await getQuiz()),
  );
  app.put("/api/admin/quiz", auth, admin, async (req, res) => {
    const items = req.body.questions;
    if (
      !Array.isArray(items) ||
      items.length !== 10 ||
      items.some(
        (q) =>
          !q ||
          typeof q.question !== "string" ||
          q.question.trim().length < 10 ||
          q.question.length > 250 ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          q.options.some(
            (o) => typeof o !== "string" || !o.trim() || o.length > 150,
          ) ||
          !Number.isInteger(q.answer) ||
          q.answer < 0 ||
          q.answer > 3,
      )
    )
      return res.status(400).json({
        error:
          "Le quiz doit contenir 10 questions, quatre choix par question et une bonne réponse.",
      });
    const clean = items.map((q, i) => ({
      id: "q" + (i + 1),
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      answer: q.answer,
    }));
    await transaction(db, async () => {
      await db
        .prepare(
          "INSERT INTO settings(key,value) VALUES ('quiz',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(JSON.stringify(clean));
      await db
        .prepare(
          "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
        )
        .run(
          req.user.id,
          "quiz_update",
          null,
          "Mise à jour des 10 questions ; dossiers existants conservés.",
        );
    });
    res.json({
      ok: true,
    });
  });
  app.get("/api/admin/audit", auth, admin, async (req, res) =>
    res.json(
      await db
        .prepare(
          "SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.actor ORDER BY a.id DESC LIMIT 100",
        )
        .all(),
    ),
  );
  app.use("/api", (req, res) =>
    res.status(404).json({
      error: "Route introuvable.",
    }),
  );
  app.use((err, req, res, next) => {
    if (isUniqueViolation(err))
      return res.status(409).json({
        error:
          "Cette opération a déjà été effectuée. Actualise ton espace personnel.",
      });
    console.error("Erreur serveur:", err.code || err.name);
    res.status(err.status === 400 ? 400 : 500).json({
      error:
        err.status === 400
          ? "Requête invalide."
          : "Une erreur est survenue. Réessaie plus tard.",
    });
  });
  return app;
}
