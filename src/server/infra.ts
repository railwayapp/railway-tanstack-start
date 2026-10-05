import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { getDb } from './db.server'
import { getRailwayEnv } from '~/lib/railway'

const bootedAt = Date.now()

function databaseHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? '').hostname || null
  } catch {
    return null
  }
}

// Everything the "Live from Railway" card shows. Called on every request so a
// redeploy (new deployment id / commit) or a different replica is visible.
export const getInfra = createServerFn({ method: 'GET' }).handler(async () => {
  const env = getRailwayEnv()
  const host = databaseHost()

  let dbLatencyMs: number | null = null
  let dbError: string | null = null
  try {
    const db = getDb()
    await db.execute(sql`select 1`) // warm the pooled connection
    const start = performance.now()
    await db.execute(sql`select 1`)
    dbLatencyMs = Math.round((performance.now() - start) * 100) / 100
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Database unavailable'
  }

  return {
    ...env,
    nodeVersion: process.version,
    uptimeSeconds: Math.round((Date.now() - bootedAt) / 1000),
    renderedAt: new Date().toISOString(),
    db: {
      host,
      privateNetwork: host?.endsWith('.railway.internal') ?? false,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
  }
})

export type Infra = Awaited<ReturnType<typeof getInfra>>
