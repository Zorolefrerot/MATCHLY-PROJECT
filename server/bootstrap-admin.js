import { hashPassword } from "./store.js";

// Called before the HTTP port opens. Never promote an account registered through
// the public API, and never change an existing owner's credentials on restart.
export async function bootstrapAdmin(
  db,
  env = process.env,
  { required = false } = {},
) {
  return db.transaction(async () => {
    const existing = await db
      .prepare("SELECT id FROM users WHERE role='admin'")
      .get();
    if (existing) return { created: false, configured: true };
    const {
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
      ADMIN_NAME: name = "Hokage",
    } = env;
    if (!email && !password && !required)
      return { created: false, configured: false };
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 14 ||
      password.length > 128 ||
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 30
    )
      throw new Error(
        "Configure ADMIN_EMAIL, ADMIN_PASSWORD (14 à 128 caractères) et ADMIN_NAME (3 à 30 caractères) dans les variables privées du serveur.",
      );
    const normalized = email.trim().toLowerCase();
    if (await db.prepare("SELECT id FROM users WHERE email=?").get(normalized))
      throw new Error(
        "L’adresse choisie possède déjà un compte joueur. Utilise une adresse distincte pour le propriétaire ; aucune promotion automatique n’est autorisée.",
      );
    const result = await db
      .prepare(
        "INSERT INTO users(name,email,password,role) VALUES (?,?,?,'admin')",
      )
      .run(name.trim(), normalized, hashPassword(password));
    await db
      .prepare("INSERT INTO audit(actor,action,target,detail) VALUES (?,?,?,?)")
      .run(
        Number(result.lastInsertRowid),
        "owner_created",
        null,
        "Initialisation privée du propriétaire.",
      );
    return { created: true, configured: true };
  });
}
