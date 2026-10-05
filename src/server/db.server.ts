import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// `*.server.ts` files are blocked from the client bundle by Start's import
// protection: the build fails if client code imports one, so DATABASE_URL and
// the driver stay on the server.

let db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Run `pnpm db:up` locally, or add a Postgres service on Railway.',
      )
    }
    // One pool per process. Railway runs a long-lived server, so connections
    // are reused across requests instead of re-opened per invocation.
    db = drizzle(postgres(url, { max: 10 }), { schema })
  }
  return db
}

export { schema }
