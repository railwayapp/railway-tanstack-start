import { createServerFn } from '@tanstack/react-start'
import { count, countDistinct, desc, gte, sql } from 'drizzle-orm'
import { getDb, schema } from './db.server'

const { departures } = schema
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)

// Fast: awaited in the loader, so it's part of the first HTML flush.
export const getStatsSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [row] = await getDb()
      .select({
        total: count(),
        destinations: countDistinct(departures.destination),
        regions: countDistinct(departures.region),
        lastDay: sql<number>`count(*) filter (where ${departures.createdAt} >= ${hoursAgo(24).toISOString()})`.mapWith(Number),
      })
      .from(departures)
    return row!
  },
)

// "Slow": not awaited in the loader. The page renders immediately and these
// stream in over the same HTTP response when they resolve.
export const getTopDestinations = createServerFn({ method: 'GET' }).handler(
  async () => {
    await simulateSlowQuery(700)
    return getDb()
      .select({ destination: departures.destination, total: count() })
      .from(departures)
      .groupBy(departures.destination)
      .orderBy(desc(count()))
      .limit(6)
  },
)

export const getHourlyActivity = createServerFn({ method: 'GET' }).handler(
  async () => {
    await simulateSlowQuery(1400)
    const rows = await getDb()
      .select({
        hour: sql<string>`date_trunc('hour', ${departures.createdAt})`,
        total: count(),
      })
      .from(departures)
      .where(gte(departures.createdAt, hoursAgo(23)))
      .groupBy(sql`1`)

    const byHour = new Map(
      rows.map((r) => [new Date(r.hour).getTime(), r.total]),
    )
    const now = new Date()
    now.setMinutes(0, 0, 0)
    return Array.from({ length: 24 }, (_, i) => {
      const t = now.getTime() - (23 - i) * 3_600_000
      return { hour: new Date(t).toISOString(), total: byHour.get(t) ?? 0 }
    })
  },
)

// Demo only: makes streaming visible on a tiny dataset. Delete in your app.
function simulateSlowQuery(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
