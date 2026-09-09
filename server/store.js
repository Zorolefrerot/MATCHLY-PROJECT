import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  randomInt,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    scryptSync(password, salt, 64),
  );
}
export function openStore(
  path = process.env.DATABASE_PATH || "./data/idrem.sqlite",
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'player', created TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), character TEXT NOT NULL, discovery TEXT NOT NULL, goals TEXT NOT NULL, motivation TEXT NOT NULL, story TEXT NOT NULL, answers TEXT NOT NULL, quiz_snapshot TEXT NOT NULL, score INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', message TEXT NOT NULL DEFAULT '', created TEXT DEFAULT CURRENT_TIMESTAMP, updated TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS allocations(user_id INTEGER PRIMARY KEY REFERENCES users(id), clan TEXT NOT NULL, affinity TEXT NOT NULL, mokuton INTEGER NOT NULL, created TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS mokuton_slots(position INTEGER PRIMARY KEY, potential INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, actor INTEGER REFERENCES users(id), action TEXT NOT NULL, target INTEGER, detail TEXT NOT NULL, created TEXT DEFAULT CURRENT_TIMESTAMP);`);
  if (db.prepare("SELECT COUNT(*) AS n FROM mokuton_slots").get().n === 0) {
    const slots = Array.from({ length: 20 }, (_, i) => (i < 3 ? 1 : 0));
    for (let i = 19; i > 0; i--) {
      const j = randomInt(i + 1);
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      slots.forEach((v, i) =>
        db.prepare("INSERT INTO mokuton_slots VALUES (?,?)").run(i, v),
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return db;
}
export function transaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function decide(db, actor, id, status, message = "") {
  return transaction(db, () => {
    const app = db.prepare("SELECT * FROM applications WHERE id=?").get(id);
    if (!app) throw new Error("Candidature introuvable.");
    // First cohort only. Replacing admitted players requires explicit rules for rare slots.
    if (app.status === "accepted" && status !== "accepted")
      throw new Error(
        "Le remplacement d’un joueur admis n’est pas encore activé.",
      );
    if (
      status === "accepted" &&
      app.status !== "accepted" &&
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM applications WHERE status='accepted'",
        )
        .get().n >= 20
    )
      throw new Error("Les 20 places sont déjà attribuées.");
    db.prepare(
      "UPDATE applications SET status=?, message=?, updated=CURRENT_TIMESTAMP WHERE id=?",
    ).run(status, message, id);
    db.prepare(
      "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
    ).run(actor, "decision", id, JSON.stringify({ status, message }));
  });
}
export const rare = ["Uchiwa", "Uzumaki", "Senju"];
export const common = [
  "Hyūga",
  "Akimichi",
  "Yamanaka",
  "Aburame",
  "Inuzuka",
  "Fushiguro",
  "Itadori",
  "Kurosaki",
  "Shunsui",
  "Yeager",
  "Ackerman",
];
export function allocate(db, userId) {
  return transaction(db, () => {
    if (
      db.prepare("SELECT status FROM applications WHERE user_id=?").get(userId)
        ?.status !== "accepted"
    )
      throw new Error("Ta candidature doit être acceptée.");
    const existing = db
      .prepare("SELECT * FROM allocations WHERE user_id=?")
      .get(userId);
    if (existing) return existing;
    const count = db.prepare("SELECT COUNT(*) AS n FROM allocations").get().n;
    if (count >= 20) throw new Error("La cohorte est complète.");
    const choices = [
      ...rare.map((name) => ({
        name,
        weight:
          db
            .prepare("SELECT COUNT(*) AS n FROM allocations WHERE clan=?")
            .get(name).n >= 3
            ? 0
            : 88,
      })),
      ...common.map((name) => ({ name, weight: 76 })),
    ];
    // Provisional policy: equal common weights, then normalize available weights.
    let draw = randomInt(choices.reduce((n, x) => n + x.weight, 0));
    let clan = common[0];
    for (const c of choices) {
      draw -= c.weight;
      if (draw < 0) {
        clan = c.name;
        break;
      }
    }
    const n = randomInt(100);
    const affinity =
      n < 16
        ? "Katon"
        : n < 37
          ? "Fūton"
          : n < 58
            ? "Raiton"
            : n < 79
              ? "Doton"
              : "Suiton";
    const mokuton = db
      .prepare("SELECT potential FROM mokuton_slots WHERE position=?")
      .get(count).potential;
    db.prepare(
      "INSERT INTO allocations(user_id,clan,affinity,mokuton) VALUES (?,?,?,?)",
    ).run(userId, clan, affinity, mokuton);
    db.prepare(
      "INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)",
    ).run(
      userId,
      "allocation",
      userId,
      JSON.stringify({ clan, affinity, mokuton }),
    );
    return db.prepare("SELECT * FROM allocations WHERE user_id=?").get(userId);
  });
}
