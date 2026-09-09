import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  openStore,
  allocate,
  decide,
  hashPassword,
  verifyPassword,
} from "../server/store.js";
import { createApp } from "../server/app.js";
import { quiz } from "../server/quiz.js";
const password = "UnePhraseDeTest!2026";
async function addUser(db, n, role = "player") {
  return Number(
    (
      await db
        .prepare("INSERT INTO users(name,email,password,role) VALUES (?,?,?,?)")
        .run(
          "Ninja" + n,
          `ninja${n}@example.test`,
          hashPassword(password),
          role,
        )
    ).lastInsertRowid,
  );
}
async function addApplication(db, id) {
  return Number(
    (
      await db
        .prepare(
          "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          "Ninja",
          "Un ami",
          "Objectif test",
          "Motivation test",
          "Histoire test",
          "{}",
          JSON.stringify(quiz),
          5,
        )
    ).lastInsertRowid,
  );
}
test("password hashing uses unique salts and verifies safely", () => {
  const a = hashPassword(password),
    b = hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(verifyPassword(password, a), true);
  assert.equal(verifyPassword("wrong", a), false);
});
test("20 admissions maximum; exactly 3 Mokuton; rare caps; stable single draws", async () => {
  const db = await openStore(":memory:");
  const owner = await addUser(db, "owner", "admin");
  const results = [];
  for (let i = 0; i < 20; i++) {
    const user = await addUser(db, i);
    const app = await addApplication(db, user);
    await decide(db, owner, app, "accepted", "Bienvenue");
    const one = await allocate(db, user);
    const two = await allocate(db, user);
    assert.deepEqual(one, two);
    results.push(one);
  }
  assert.equal(results.filter((r) => r.mokuton).length, 3);
  for (const clan of ["Uchiwa", "Senju", "Uzumaki"])
    assert.ok(results.filter((r) => r.clan === clan).length <= 3);
  const extra = await addUser(db, 21);
  const app = await addApplication(db, extra);
  await assert.rejects(
    async () => await decide(db, owner, app, "accepted"),
    /20 places/,
  );
  await assert.rejects(async () => await allocate(db, extra), /acceptée/);
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM allocations").get()).n,
    20,
  );
  await assert.rejects(
    async () => await decide(db, owner, 1, "rejected"),
    /remplacement/,
  );
  await db.close();
});
test("database persists accounts and decisions on disk", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-"));
  try {
    const path = join(dir, "db.sqlite");
    let db = await openStore(path);
    const id = await addUser(db, 1);
    await addApplication(db, id);
    await db.close();
    db = await openStore(path);
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM users").get()).n,
      1,
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM applications").get()).n,
      1,
    );
    assert.equal(
      (await db.prepare("SELECT SUM(potential) AS n FROM mokuton_slots").get())
        .n,
      3,
    );
    await db.close();
  } finally {
    rmSync(dir, {
      recursive: true,
      force: true,
    });
  }
});
test("HTTP lifecycle: auth, private application, admission, quiz secrecy, logout and CSRF", async () => {
  const db = await openStore(":memory:");
  await addUser(db, "owner", "admin");
  const app = createApp(db);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { cookie, body, headers = {}, method } = {}) => {
    const r = await fetch(base + "/api" + path, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(cookie
          ? {
              Cookie: cookie,
            }
          : {}),
        ...headers,
      },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    assert.equal((await request("/me")).body.user, null);
    const q = await request("/quiz");
    assert.equal(q.body.length, 10);
    assert.ok(q.body.every((q) => !("answer" in q)));
    assert.equal((await request("/admin/applications")).status, 401);
    assert.equal(
      (
        await request("/auth/register", {
          body: {
            name: "Ninja",
            email: "ninja@example.test",
            password,
          },
          headers: {
            origin: "https://evil.test",
          },
        })
      ).status,
      403,
    );
    const reg = await request("/auth/register", {
      body: {
        name: "Ninja",
        email: "ninja@example.test",
        password,
        role: "admin",
      },
    });
    assert.equal(reg.status, 201);
    assert.equal(reg.body.user.role, "player");
    assert.ok(reg.cookie);
    const cookie = reg.cookie;
    assert.equal(
      (
        await request("/admin/applications", {
          cookie,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/allocation", {
          cookie,
          body: {},
        })
      ).status,
      409,
    );
    const invalid = await request("/application", {
      cookie,
      body: {},
    });
    assert.equal(invalid.status, 400);
    const data = {
      character: "Haru Shinobi",
      discovery: "Un ami m’a parlé du projet",
      goals: "Je souhaite aider mon équipe et progresser ensemble.",
      motivation:
        "Je veux participer à une communauté respectueuse et construire des histoires.",
      story:
        "Un jeune genin de Konoha qui rêve de protéger ses amis et de découvrir le monde.",
      answers: Object.fromEntries(quiz.map((q) => [q.id, q.answer])),
      consent: true,
    };
    assert.equal(
      (
        await request("/application", {
          cookie,
          body: data,
        })
      ).status,
      201,
    );
    assert.equal(
      (
        await request("/application", {
          cookie,
          body: data,
        })
      ).status,
      409,
    );
    const me = (
      await request("/me", {
        cookie,
      })
    ).body;
    assert.equal(me.application.status, "pending");
    assert.ok(!("score" in me.application));
    assert.ok(!("password" in me.user));
    const other = await request("/auth/register", {
      body: {
        name: "Autre",
        email: "other@example.test",
        password,
      },
    });
    assert.equal(
      (
        await request("/me", {
          cookie: other.cookie,
        })
      ).body.application,
      null,
    );
    const owner = await request("/auth/login", {
      body: {
        email: "ninjaowner@example.test",
        password,
      },
    });
    assert.equal(owner.status, 200);
    const adminCookie = owner.cookie;
    const list = await request("/admin/applications", {
      cookie: adminCookie,
    });
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].score, 10);
    assert.equal(
      (
        await request(`/admin/applications/${me.application.id}`, {
          cookie,
          body: {
            status: "accepted",
            message: "hack",
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(`/admin/applications/${me.application.id}`, {
          cookie: adminCookie,
          body: {
            status: "accepted",
            message: "Bienvenue",
          },
        })
      ).status,
      200,
    );
    const [first, second] = await Promise.all([
      request("/allocation", {
        cookie,
        body: {},
      }),
      request("/allocation", {
        cookie,
        body: {},
      }),
    ]);
    assert.equal(first.status, 200);
    assert.deepEqual(first.body, second.body);
    assert.equal((await request("/info")).body.accepted, 1);
    assert.equal(
      (
        await request("/auth/reset", {
          body: {
            token: "invalid",
            password,
          },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/auth/forgot", {
          body: {
            email: "ninja@example.test",
          },
        })
      ).status,
      503,
    );
    await request("/auth/logout", {
      cookie,
      body: {},
    });
    assert.equal(
      (
        await request("/me", {
          cookie,
        })
      ).body.user,
      null,
    );
    const login = await request("/auth/login", {
      body: {
        email: "ninja@example.test",
        password,
      },
    });
    assert.equal(login.status, 200);
    assert.equal(
      (
        await request("/auth/login", {
          body: {
            email: "ninja@example.test",
            password: "wrong",
          },
        })
      ).status,
      401,
    );
  } finally {
    app.locals.cleanup();
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
});
