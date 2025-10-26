import { Pool, PoolClient } from "pg";

// Connection pool singleton
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  return pool;
}

export async function getClient(): Promise<PoolClient> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  return client;
}

export async function query(text: string, params?: any[]) {
  const poolInstance = getPool();
  const start = Date.now();
  try {
    const res = await poolInstance.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error", { text, error });
    throw error;
  }
}

// Graceful shutdown
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
