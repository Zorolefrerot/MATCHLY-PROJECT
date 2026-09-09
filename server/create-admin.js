import { openStore, hashPassword } from "./store.js";
const {
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD: password,
  ADMIN_NAME: name = "Hokage",
} = process.env;
if (
  !email ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  !password ||
  password.length < 14
) {
  console.error(
    "Configure ADMIN_EMAIL et ADMIN_PASSWORD (14 caractères minimum) dans un environnement privé. Ne les ajoute pas à Git.",
  );
  process.exit(1);
}
const db = openStore();
if (db.prepare("SELECT id FROM users WHERE role='admin'").get()) {
  console.error("Un propriétaire existe déjà. Aucun changement effectué.");
  process.exit(1);
}
if (
  db
    .prepare("SELECT id FROM users WHERE email=?")
    .get(email.trim().toLowerCase())
) {
  console.error(
    "Cette adresse possède déjà un compte. Utilise une adresse dédiée au propriétaire.",
  );
  process.exit(1);
}
db.prepare(
  "INSERT INTO users(name,email,password,role) VALUES (?,?,?,'admin')",
).run(name, email.trim().toLowerCase(), hashPassword(password));
db.close();
console.log(
  "Compte propriétaire créé. Retire ADMIN_PASSWORD de la configuration et connecte-toi sur le site.",
);
