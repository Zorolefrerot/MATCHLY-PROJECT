import { openStore } from "./store.js";
import { bootstrapAdmin } from "./bootstrap-admin.js";
let db;
try {
  db = await openStore();
  const result = await bootstrapAdmin(db, process.env, { required: true });
  console.log(
    result.created
      ? "Propriétaire créé. Retire ADMIN_PASSWORD de la configuration, puis connecte-toi sur le site."
      : "Un propriétaire existe déjà. Aucun mot de passe ni accès n’a été modifié.",
  );
} catch (error) {
  console.error(
    error.code
      ? `Échec de configuration (${error.code}). Vérifie les paramètres privés.`
      : error.message,
  );
  process.exitCode = 1;
} finally {
  if (db) await db.close();
}
