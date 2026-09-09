import { test, expect } from "@playwright/test";
import express from "express";
import { resolve } from "node:path";
import { createApp } from "../server/app.js";
import { openStore, hashPassword } from "../server/store.js";
// These fixtures exist only inside an isolated, in-memory test server.
const email = "candidate@example.test";
const password = "TestOnlyPassword!123";
let server, app, db, base;
test.beforeAll(async () => {
  db = openStore(":memory:");
  db.prepare(
    "INSERT INTO users(name,email,password,role) VALUES (?,?,?,'admin')",
  ).run("Test Owner", "owner@example.test", hashPassword(password));
  app = createApp(db);
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  server = app.listen(0, "0.0.0.0");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  app.locals.cleanup();
  await new Promise((r) => server.close(r));
  db.close();
});
test("home, clan filters, FAQ and mobile layout", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "TA VOIE NINJA",
  );
  await page.getByRole("button", { name: "Tous les clans · 14" }).click();
  await expect(page.locator(".clan-card")).toHaveCount(14);
  await page.getByRole("button", { name: "Clans rares", exact: true }).click();
  await expect(page.locator(".clan-card")).toHaveCount(3);
  await page
    .getByText("Est-ce que je peux déjà jouer sur Android ?", { exact: true })
    .click();
  await expect(
    page.getByText("Pas encore. Cette première version", { exact: false }),
  ).toBeVisible();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Candidature" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ta place commence ici." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("candidate registration, quiz, admin decision and stable heritage", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(base + "/inscription");
  await page.getByLabel("Pseudo", { exact: true }).fill("Haru");
  await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Créer mon compte", exact: true })
    .click();
  await expect(page).toHaveURL(base + "/espace");
  await page.getByRole("link", { name: "Commencer ma candidature" }).click();
  await page
    .getByLabel("Où as-tu découvert IDREM ZENKAI ?", { exact: false })
    .fill("Un ami m’a parlé de cette communauté.");
  await page
    .getByLabel("Que souhaites-tu faire dans le jeu ?", { exact: false })
    .fill("Je souhaite participer à des missions avec mes amis.");
  await page
    .getByLabel("Qu’est-ce qui te motive à nous rejoindre ?", { exact: false })
    .fill("Je veux construire des histoires avec une communauté respectueuse.");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByLabel("Nom du personnage", { exact: false })
    .fill("Haru Shinobi");
  await page
    .getByLabel("Son histoire en quelques mots", { exact: false })
    .fill(
      "Haru est un jeune genin de Konoha qui rêve de protéger ses amis et sa famille.",
    );
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.locator(".quiz-question")).toHaveCount(10);
  for (const question of await page.locator(".quiz-question").all())
    await question.locator("input").first().check();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page).toHaveURL(base + "/espace");
  await expect(page.locator(".status")).toHaveText("En cours d’examen");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Haru Shinobi", exact: true }),
  ).toBeVisible();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await owner.goto(base + "/connexion");
  await owner.getByLabel("Adresse e-mail").fill("owner@example.test");
  await owner.getByLabel("Mot de passe", { exact: true }).fill(password);
  await owner
    .getByRole("button", { name: "Se connecter", exact: true })
    .click();
  await expect(owner).toHaveURL(base + "/admin");
  await owner.locator(".applicant-row").click();
  await expect(owner.getByRole("dialog")).toBeVisible();
  await owner
    .getByRole("dialog")
    .getByRole("combobox")
    .selectOption("accepted");
  await owner
    .getByLabel("Message au candidat")
    .fill("Bienvenue à Konoha, Haru !");
  await owner.getByRole("button", { name: "Enregistrer la décision" }).click();
  await expect(owner.locator(".modal")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".status")).toHaveText("Acceptée");
  await page.getByRole("button", { name: "Révéler mon héritage" }).click();
  await expect(page.locator(".allocation-grid")).toBeVisible();
  const result = await page.locator(".allocation-grid").innerText();
  await page.reload();
  await expect(page.locator(".allocation-grid")).toHaveText(result, {
    useInnerText: true,
  });
  await owner.getByRole("button", { name: "Quiz", exact: true }).click();
  await expect(
    owner.getByRole("dialog", { name: "Modifier le quiz" }),
  ).toBeVisible();
  await owner
    .getByLabel("Énoncé", { exact: true })
    .first()
    .fill("Au début de Shippuden, qui dirige Konoha ?");
  await owner.getByRole("button", { name: "Enregistrer le quiz" }).click();
  await expect(owner.locator(".modal")).toHaveCount(0);
  await ownerContext.close();
  await context.close();
});
