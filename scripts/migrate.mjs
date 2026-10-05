// Runs as Railway's pre-deploy command (see .railway/railway.ts) before each new
// deployment receives traffic. Applies pending migrations, then seeds a few
// departures on a fresh database so the board isn't empty on first boot.
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

try {
  process.loadEnvFile?.()
} catch {}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(url, { max: 1, connect_timeout: 10, onnotice: () => {} })
const db = drizzle(sql)

// On a brand-new project, Postgres may still be starting when this runs.
// Railway doesn't retry a failed pre-deploy command, so wait for it here.
for (let attempt = 1; ; attempt++) {
  try {
    await sql`select 1`
    break
  } catch (error) {
    if (attempt >= 20) throw error
    console.log(`waiting for Postgres (attempt ${attempt}): ${error.message}`)
    await new Promise((r) => setTimeout(r, 3000))
  }
}

await migrate(db, { migrationsFolder: './drizzle' })
console.log('✓ migrations applied')

const [{ count }] = await sql`select count(*)::int as count from departures`
if (count === 0) {
  const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString()
  const seed = [
    ['Railway', 'All aboard! TanStack Start is live.', 'San Francisco', 1, 2],
    ['Conductor', 'Mind the gap between SSR and hydration', 'London', 4, 18],
    ['Night Owl', 'Shipped it before my coffee got cold', 'Tokyo', 7, 47],
    ['Platform 9', 'Type-safe routes all the way down', 'Amsterdam', 9, 95],
    ['First Class', 'Server functions are just functions', 'New York', 2, 190],
    ['Late Express', 'Streaming SSR, no waiting on the platform', 'Singapore', 5, 420],
  ]
  for (const [name, message, destination, platform, mins] of seed) {
    await sql`
      insert into departures (name, message, destination, platform, region, owner_id, created_at)
      values (${name}, ${message}, ${destination}, ${platform}, 'seed', 'seed', ${minutesAgo(mins)})
    `
  }
  console.log(`✓ seeded ${seed.length} departures`)
}

await sql.end()
