import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { DESTINATIONS, destinationSchema } from '~/lib/destinations'
import { getDb, schema } from '~/server/db.server'

// A server route: a plain HTTP endpoint living next to your pages.
// Try it: curl https://<your-app>.up.railway.app/api/departures?dest=Tokyo
export const Route = createFileRoute('/api/departures')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const dest = destinationSchema.safeParse(url.searchParams.get('dest'))
        const limit = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get('limit')) || 20),
        )

        if (url.searchParams.has('dest') && !dest.success) {
          return Response.json(
            { error: 'Unknown destination', destinations: DESTINATIONS },
            { status: 400 },
          )
        }

        const rows = await getDb()
          .select({
            id: schema.departures.id,
            name: schema.departures.name,
            message: schema.departures.message,
            destination: schema.departures.destination,
            platform: schema.departures.platform,
            region: schema.departures.region,
            createdAt: schema.departures.createdAt,
          })
          .from(schema.departures)
          .where(dest.success ? eq(schema.departures.destination, dest.data) : undefined)
          .orderBy(desc(schema.departures.createdAt))
          .limit(limit)

        return Response.json(
          { departures: rows },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              // Cacheable by shared caches for 10s. Railway's CDN honors this
              // once it's enabled for the service (`railway cdn enable`).
              'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
            },
          },
        )
      },
    },
  },
})
