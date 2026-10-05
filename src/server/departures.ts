import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema } from './db.server'
import { checkRateLimit, containsBlockedContent } from './moderation.server'
import { ensureVisitorId, getVisitorId } from './session.server'
import type { DepartureRow } from './schema'
import type { Departure, Destination } from '~/lib/destinations'
import { destinationSchema, newDepartureSchema } from '~/lib/destinations'
import { getRailwayEnv } from '~/lib/railway'

// Server functions: type-safe RPCs. The handler bodies (and every
// `*.server.ts` import they use) are compiled out of the client bundle and
// replaced with a fetch call.

export const PAGE_SIZE = 8

function toDeparture(row: DepartureRow, visitorId?: string): Departure {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    destination: row.destination as Destination,
    platform: row.platform,
    region: row.region,
    createdAt: row.createdAt.toISOString(),
    mine: Boolean(visitorId) && row.ownerId === visitorId,
  }
}

export const listDepartures = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      dest: destinationSchema.optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(PAGE_SIZE),
    }),
  )
  .handler(async ({ data }) => {
    const db = getDb()
    const where = data.dest
      ? eq(schema.departures.destination, data.dest)
      : undefined

    const [rows, [{ total }], visitorId] = await Promise.all([
      db
        .select()
        .from(schema.departures)
        .where(where)
        .orderBy(desc(schema.departures.createdAt))
        .limit(data.pageSize)
        .offset((data.page - 1) * data.pageSize),
      db.select({ total: count() }).from(schema.departures).where(where),
      getVisitorId(),
    ])

    return {
      items: rows.map((r) => toDeparture(r, visitorId)),
      total,
      page: data.page,
      pageCount: Math.max(1, Math.ceil(total / data.pageSize)),
    }
  })

export const getDeparture = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const [row] = await getDb()
      .select()
      .from(schema.departures)
      .where(eq(schema.departures.id, data.id))
    // Throwing notFound() renders the route's notFoundComponent.
    if (!row) throw notFound()
    return toDeparture(row, await getVisitorId())
  })

export const createDeparture = createServerFn({ method: 'POST' })
  .validator(newDepartureSchema)
  .handler(async ({ data }) => {
    if (containsBlockedContent(data.name, data.message)) {
      throw new Error('Links aren’t allowed on the board.')
    }
    // Railway's edge sets X-Real-IP to the client's address. Falls back to
    // the socket address locally.
    const ip = getRequestHeader('x-real-ip') ?? getRequestIP() ?? 'unknown'
    const limit = checkRateLimit(ip)
    if (!limit.ok) {
      throw new Error(`Easy there, conductor. Try again in ${limit.retryIn}s.`)
    }

    const visitorId = await ensureVisitorId()
    const [row] = await getDb()
      .insert(schema.departures)
      .values({
        ...data,
        platform: 1 + Math.floor(Math.random() * 9),
        region: getRailwayEnv().region,
        ownerId: visitorId,
      })
      .returning()
    return toDeparture(row!, visitorId)
  })

export const deleteDeparture = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const visitorId = await getVisitorId()
    if (!visitorId) throw new Error('You can only remove your own departures.')
    const deleted = await getDb()
      .delete(schema.departures)
      .where(
        and(
          eq(schema.departures.id, data.id),
          eq(schema.departures.ownerId, visitorId),
        ),
      )
      .returning({ id: schema.departures.id })
    if (deleted.length === 0) {
      throw new Error('You can only remove your own departures.')
    }
    return { id: data.id }
  })
