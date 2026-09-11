import express from "express";
import { installVillage } from "./village.js";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { openStore } from "./store.js";
import { bootstrapAdmin } from "./bootstrap-admin.js";

let db;
try {
  // Render supplies the real hostname; no guessed public URL or localhost is
  // embedded in the browser bundle or in recovery emails.
  if (!process.env.PUBLIC_ORIGIN && process.env.RENDER_EXTERNAL_URL)
    process.env.PUBLIC_ORIGIN = process.env.RENDER_EXTERNAL_URL.replace(
      /\/$/,
      "",
    );
  if (process.env.PUBLIC_ORIGIN) {
    const origin = new URL(process.env.PUBLIC_ORIGIN);
    if (process.env.RENDER === "true" && origin.protocol !== "https:")
      throw new Error("PUBLIC_ORIGIN doit être une URL HTTPS sur Render.");
    process.env.PUBLIC_ORIGIN = origin.origin;
  }
  db = await openStore();
  const owner = await bootstrapAdmin(db, process.env, {
    required: process.env.RENDER === "true",
  });
  if (owner.created)
    console.log(
      "Compte propriétaire créé. Retire ADMIN_PASSWORD et ADMIN_EMAIL des variables privées après la première connexion.",
    );
  const app = createApp(db);
  let vite;
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(resolve("dist")));
    app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  } else {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, "0.0.0.0", () =>
    console.log(
      `IDREM ZENKAI disponible sur le port ${port} · stockage ${db.dialect}`,
    ),
  );
  const village = installVillage(server, db);
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    app.locals.cleanup();
    village.close();
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      try {
        await vite?.close();
        await db.close();
        clearTimeout(timeout);
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} catch (error) {
  // Do not log the PostgreSQL URL or raw driver errors, even on failed startup.
  console.error(
    "Démarrage interrompu.",
    error.code
      ? `Erreur ${error.code} : vérifie DATABASE_URL et l’accès réseau.`
      : "Vérifie DATABASE_URL, PUBLIC_ORIGIN et les variables ADMIN_* (voir docs/DEPLOIEMENT_RENDER_NEON.md).",
  );
  if (db) await db.close();
  process.exitCode = 1;
}
