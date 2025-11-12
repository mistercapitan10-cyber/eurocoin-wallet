import { Pool, PoolClient } from "pg";

// Connection pool singleton
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL or DATABASE_POSTGRES_URL is not set in environment variables");
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
    console.log("[db] Executed query", { 
      text: text.substring(0, 200), // Truncate long queries
      duration, 
      rows: res.rowCount,
      params: params ? params.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p) : undefined,
    });
    return res;
  } catch (error) {
    const pgError = error as any;
    console.error("[db] Database query error", { 
      text: text.substring(0, 200),
      error: error instanceof Error ? error.message : String(error),
      code: pgError?.code,
      detail: pgError?.detail,
      hint: pgError?.hint,
      position: pgError?.position,
      stack: error instanceof Error ? error.stack : undefined,
    });
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
