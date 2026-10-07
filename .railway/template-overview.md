# Deploy and Host TanStack Start with Railway

[TanStack Start](https://tanstack.com/start) is a full-stack React framework built on TanStack Router and Vite. It gives you type-safe routing, server functions, streaming SSR, and server routes in one app, and builds to a standalone Node server.

## About Hosting TanStack Start

This template deploys a TanStack Start 1.0 app with a Postgres database. The app is **Departures**, a split-flap train-station board where visitors post a message and a destination. It's small enough to read in one sitting, but it does what real apps do: reads and writes a database, validates input, keeps a session, streams slow data, exposes a JSON API, and prerenders a static page.

Railway builds the app with Railpack and runs the Nitro output with `node .output/server/index.mjs`. Before each deploy, a pre-deploy command applies the Drizzle migrations and seeds an empty board. The new deployment only receives traffic once `/api/health` confirms it can reach the database. The app talks to Postgres over Railway's private network.

## Common Use Cases

- Starting a new full-stack React app on TanStack Start with a database already wired up
- Learning TanStack Start 1.0 features (server functions, Query SSR, streaming, selective SSR, middleware, sessions) from working code
- A reference for deploying TanStack Start with migrations and health checks on Railway

## Dependencies for TanStack Start Hosting

- Node.js 22.12+ and pnpm (installed automatically by Railpack)
- PostgreSQL (provisioned by this template)

### Deployment Dependencies

- [TanStack Start documentation](https://tanstack.com/start/latest)
- [Source repository](https://github.com/railwayapp/railway-tanstack-start)
- [Drizzle ORM](https://orm.drizzle.team)

### Implementation Details

The template sets two variables on the `web` service:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}   # private network
SESSION_SECRET=${{secret(32)}}            # encrypts the session cookie
```

To make it your own, delete the `board*` and `stats` routes and their server functions, keep `__root.tsx`, `router.tsx`, `start.ts`, `api/health.ts` and `db.server.ts`, and edit `src/server/schema.ts`. Run `pnpm db:generate` and commit the migration; the next deploy applies it before traffic switches.

## Why Deploy TanStack Start on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying TanStack Start on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
