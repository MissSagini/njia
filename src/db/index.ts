import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: postgres.Sql };

function connection() {
  // One pool per server process; reused across hot reloads in development.
  // prepare: false keeps it compatible with Supabase's transaction pooler.
  globalForDb.pg ??= postgres(serverEnv().DATABASE_URL, { prepare: false, max: 5 });
  return globalForDb.pg;
}

/**
 * Database access that bypasses Row Level Security. Only for writes and
 * system jobs that have already checked permissions in server code.
 */
export function adminDb() {
  return drizzle(connection(), { schema });
}

export type Tx = Parameters<Parameters<ReturnType<typeof adminDb>["transaction"]>[0]>[0];

export type JwtClaims = { sub: string; role?: string; [key: string]: unknown };

/**
 * Runs queries as the signed-in user, so Row Level Security applies to every
 * read. Use this for all reads of student, mentor and payment data.
 */
export async function asUser<T>(claims: JwtClaims, run: (tx: Tx) => Promise<T>): Promise<T> {
  return adminDb().transaction(async (tx) => {
    await tx.execute(sql`
      select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
             set_config('request.jwt.claim.sub', ${claims.sub}, true)
    `);
    await tx.execute(sql`set local role authenticated`);
    return run(tx);
  });
}

export { schema };
