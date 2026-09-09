import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import pg from "pg";

// Application queries use ? placeholders. Quoted SQL text is left untouched.
export function postgresSql(sql) {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, (token) =>
    token === "?" ? `$${++index}` : token,
  );
}

function statements(execute) {
  return (sql) => ({
    get: async (...params) => await execute(sql, params, "get"),
    all: async (...params) => await execute(sql, params, "all"),
    run: async (...params) => await execute(sql, params, "run"),
  });
}

export function postgresOptions(connectionString) {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL doit être une connexion PostgreSQL.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const plaintext = local && url.searchParams.get("sslmode") === "disable";
  // pg's URL sslmode handling may override ssl. Set certificate verification
  // explicitly, including for Neon URLs containing sslmode=require.
  for (const key of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: plaintext ? false : { rejectUnauthorized: true },
    max: 4,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 20000,
    query_timeout: 30000,
    statement_timeout: 25000,
    application_name: "idrem-zenkai",
  };
}

export async function openPostgres(connectionString) {
  const pool = new pg.Pool(postgresOptions(connectionString));
  // Never print error messages/connection strings: they can contain credentials.
  pool.on("error", (error) =>
    console.error("Connexion PostgreSQL interrompue:", error.code || "NETWORK"),
  );
  const context = new AsyncLocalStorage();
  const query = (sql, values = []) =>
    (context.getStore() || pool).query(sql, values);
  const execute = async (sql, params, mode) => {
    let text = postgresSql(sql);
    const returnsId =
      mode === "run" &&
      /^\s*INSERT\s+INTO\s+(users|applications|audit)\b/i.test(text) &&
      !/\bRETURNING\b/i.test(text);
    if (returnsId) text = text.replace(/;\s*$/, "") + " RETURNING id";
    const result = await query(text, params);
    if (mode === "run")
      return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
    // COUNT and SUM are bigint in Postgres; convert only aggregate counts used by
    // the application, not arbitrary bigint identifiers or user-provided fields.
    const rows = result.rows.map((row) => ({
      ...row,
      ...(typeof row.n === "string" ? { n: Number(row.n) } : {}),
    }));
    return mode === "get" ? rows[0] : rows;
  };
  const db = {
    dialect: "postgres",
    prepare: statements(execute),
    exec: (sql) => query(sql),
    async transaction(fn) {
      if (context.getStore()) return fn();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Transaction-scoped, not session-scoped: works with Neon's pooler and
        // serializes cohort/admin/reset mutations across separate app instances.
        await client.query("SELECT pg_advisory_xact_lock(794621337)");
        const result = await context.run(client, fn);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          /* original error wins */
        }
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
  return db;
}

export async function openSqlite(path) {
  const { DatabaseSync } = await import("node:sqlite");
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const sqlite = new DatabaseSync(path);
  sqlite.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  const context = new AsyncLocalStorage();
  let tail = Promise.resolve();
  const exclusive = (fn) => {
    if (context.getStore()) return Promise.resolve().then(fn);
    const result = tail.then(() => context.run(true, fn));
    tail = result.catch(() => {});
    return result;
  };
  const execute = (sql, params, mode) =>
    exclusive(() => sqlite.prepare(sql)[mode](...params));
  return {
    dialect: "sqlite",
    prepare: statements(execute),
    exec: (sql) => exclusive(() => sqlite.exec(sql)),
    transaction: (fn) =>
      exclusive(async () => {
        sqlite.exec("BEGIN IMMEDIATE");
        try {
          const result = await fn();
          sqlite.exec("COMMIT");
          return result;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      }),
    close: () => exclusive(() => sqlite.close()),
  };
}

export function isUniqueViolation(error) {
  return (
    error.code === "23505" ||
    error.errcode === 2067 ||
    error.errcode === 1555 ||
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
