import { Pool } from "pg";

/**
 * Singleton Postgres pool.
 * Connection string is injected via SSM Parameter Store at deploy time
 * and surfaced as the DATABASE_URL environment variable.
 */
let pool: Pool | null = null;

export const getDb = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: true }
          : false,
    });

    pool.on("error", (err) => {
      console.error("Unexpected Postgres pool error", err);
    });
  }
  return pool;
};
