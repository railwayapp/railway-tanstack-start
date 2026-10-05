import { createFileRoute } from '@tanstack/react-router'
import { sql } from 'drizzle-orm'
import { getDb } from '~/server/db.server'

// Railway's health check (see .railway/railway.ts). A new deployment only
// receives traffic once this returns a 2xx, so a deploy that can't reach its
// database never replaces a working one. Railway checks it during deploys
// only; it isn't continuous monitoring.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await getDb().execute(sql`select 1`)
          return Response.json(
            { status: 'ok', database: 'ok' },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        } catch (error) {
          console.error('[health] database check failed', error)
          return Response.json(
            { status: 'error', database: 'unreachable' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
          )
        }
      },
    },
  },
})
