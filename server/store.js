import {
  randomInt,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { openPostgres, openSqlite } from "./database.js";
import { schema } from "./schema.js";
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
export async function openStore(path) {
  // An explicit path is for local development/tests. Hosting must not silently
  // fall back to an ephemeral SQLite file if DATABASE_URL was omitted.
  if (
    path === undefined &&
    process.env.RENDER === "true" &&
    !process.env.DATABASE_URL
  )
    throw new Error(
      "DATABASE_URL est obligatoire sur Render. Ajoute la connexion Neon dans Environment.",
    );
  const db =
    path === undefined && process.env.DATABASE_URL
      ? await openPostgres(process.env.DATABASE_URL)
      : await openSqlite(
          path || process.env.DATABASE_PATH || "./data/idrem.sqlite",
        );
  try {
    await db.transaction(async () => {
      await db.exec(schema(db.dialect));
      if (
        (await db.prepare("SELECT COUNT(*) AS n FROM mokuton_slots").get())
          .n === 0
      ) {
        const slots = Array.from(
          {
            length: 20,
          },
          (_, i) => (i < 3 ? 1 : 0),
        );
        for (let i = 19; i > 0; i--) {
          const j = randomInt(i + 1);
          [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        for (const [i, value] of slots.entries())
          await db
            .prepare("INSERT INTO mokuton_slots VALUES (?,?)")
            .run(i, value);
      }
      await mapAllocationSeats(db);
    });
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
// Assign seats to legacy draws by matching their existing potential, never rerolling.
// Called only under the same SQLite transaction / PostgreSQL advisory lock.
export async function mapAllocationSeats(db) {
  const rows = await db
    .prepare(
      "SELECT l.user_id,l.mokuton FROM allocations l LEFT JOIN allocation_seats s ON s.user_id=l.user_id WHERE s.user_id IS NULL ORDER BY l.created,l.user_id",
    )
    .all();
  if (!rows.length) return;
  const free = await db
    .prepare(
      "SELECT m.position,m.potential FROM mokuton_slots m LEFT JOIN allocation_seats s ON s.position=m.position WHERE s.position IS NULL ORDER BY m.position",
    )
    .all();
  for (const row of rows) {
    const index = free.findIndex((seat) => seat.potential === row.mokuton);
    if (index < 0)
      throw new Error(
        "Attributions incohérentes : aucune modification automatique des potentiels.",
      );
    const [seat] = free.splice(index, 1);
    await db
      .prepare("INSERT INTO allocation_seats(user_id,position) VALUES (?,?)")
      .run(row.user_id, seat.position);
  }
}
export function transaction(db, fn) {
  return db.transaction(fn);
}
export async function decide(db, actor, id, status, message = "") {
  return await transaction(db, async () => {
    const app = await db
      .prepare("SELECT * FROM applications WHERE id=?")
      .get(id);
    if (!app) throw new Error("Candidature introuvable.");
    // Account removal is a separate, confirmed action; a decision edit cannot erase a player.
    if (app.status === "accepted" && status !== "accepted")
      throw new Error(
        "Le remplacement passe par la suppression protégée du compte pour libérer cette place.",
      );
    if (
      status === "accepted" &&
      app.status !== "accepted" &&
      (
        await db
          .prepare(
            "SELECT COUNT(*) AS n FROM applications WHERE status='accepted'",
          )
          .get()
      ).n >= 20
    )
      throw new Error("Les 20 places sont déjà attribuées.");
    await db
      .prepare(
        "UPDATE applications SET status=?, message=?, updated=? WHERE id=?",
      )
      .run(
        status,
        message,
        new Date().toISOString().slice(0, 19).replace("T", " "),
        id,
      );
    await db
      .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
      .run(
        actor,
        "decision",
        id,
        JSON.stringify({
          status,
          message,
        }),
      );
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
export async function allocate(db, userId) {
  return await transaction(db, async () => {
    if (
      (
        await db
          .prepare("SELECT status FROM applications WHERE user_id=?")
          .get(userId)
      )?.status !== "accepted"
    )
      throw new Error("Ta candidature doit être acceptée.");
    await mapAllocationSeats(db);
    const existing = await db
      .prepare("SELECT * FROM allocations WHERE user_id=?")
      .get(userId);
    if (existing) return existing;
    const count = (
      await db.prepare("SELECT COUNT(*) AS n FROM allocations").get()
    ).n;
    if (count >= 20) throw new Error("La cohorte est complète.");
    const counts = await db
      .prepare("SELECT clan, COUNT(*) AS n FROM allocations GROUP BY clan")
      .all();
    const choices = [
      ...rare.map((name) => ({
        name,
        weight: (counts.find((row) => row.clan === name)?.n || 0) >= 3 ? 0 : 88,
      })),
      ...common.map((name) => ({
        name,
        weight: 76,
      })),
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
    const seat = await db
      .prepare(
        "SELECT m.position,m.potential FROM mokuton_slots m LEFT JOIN allocation_seats s ON s.position=m.position WHERE s.position IS NULL ORDER BY m.position LIMIT 1",
      )
      .get();
    if (!seat) throw new Error("La cohorte est complète.");
    const mokuton = seat.potential;
    await db
      .prepare(
        "INSERT INTO allocations(user_id,clan,affinity,mokuton) VALUES (?,?,?,?)",
      )
      .run(userId, clan, affinity, mokuton);
    await db
      .prepare("INSERT INTO allocation_seats(user_id,position) VALUES (?,?)")
      .run(userId, seat.position);
    await db
      .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
      .run(
        userId,
        "allocation",
        userId,
        JSON.stringify({
          clan,
          affinity,
          mokuton,
        }),
      );
    return await db
      .prepare("SELECT * FROM allocations WHERE user_id=?")
      .get(userId);
  });
}
