import { Link, createFileRoute } from '@tanstack/react-router'
import { Code } from '~/components/Code'
import { PageHeader } from '~/components/SiteChrome'
import { seo } from '~/lib/seo'
import { site } from '~/lib/site'

// This page has no loader and no request-time data, so it's prerendered to
// static HTML at build time (see `prerender` in vite.config.ts).
export const Route = createFileRoute('/features')({
  head: () => ({
    meta: seo({
      title: 'How it’s built',
      description:
        'A tour of the TanStack Start features used in this Railway template.',
    }),
  }),
  component: FeaturesPage,
})

type Section = {
  id: string
  title: string
  body: React.ReactNode
  file: string
  code: string
  live?: React.ReactNode
}

const SECTIONS: Array<Section> = [
  {
    id: 'server-functions',
    title: 'Server functions',
    body: '`createServerFn` defines a function that always runs on the server but can be called from anywhere — loaders, components, event handlers. Input is validated with zod, and the return type flows straight to the caller. In the client bundle the handler is replaced with a fetch.',
    file: 'src/server/departures.ts',
    code: `
export const createDeparture = createServerFn({ method: 'POST' })
  .validator(newDepartureSchema)
  .handler(async ({ data }) => {
    // … moderation and rate limiting
    const visitorId = await ensureVisitorId()
    const [row] = await getDb()
      .insert(schema.departures)
      .values({ ...data, platform, region, ownerId: visitorId })
      .returning()
    return toDeparture(row, visitorId)
  })`,
    live: <Link to="/board" className="link">Post on the board</Link>,
  },
  {
    id: 'routing',
    title: 'Type-safe routing & search params',
    body: 'Routes are files. Path params and search params are parsed and validated, so `/board?dest=Tokyo&page=2` is typed everywhere it is read or linked to. A typo in a route path or a missing param is a compile error.',
    file: 'src/routes/board.index.tsx',
    code: `
const searchSchema = z.object({
  dest: destinationSchema.optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})

export const Route = createFileRoute('/board/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.query(departuresQuery(deps)),
})`,
    live: (
      <Link to="/board" search={{ dest: 'Tokyo', page: 1 }} className="link">
        /board?dest=Tokyo
      </Link>
    ),
  },
  {
    id: 'query',
    title: 'TanStack Query with SSR',
    body: 'Loaders prefetch queries on the server; `setupRouterSsrQueryIntegration` dehydrates them into the HTML stream and hydrates them in the browser. A non-zero `staleTime` stops the browser from immediately refetching what the server just sent. Components read with `useSuspenseQuery`, and posting uses an optimistic mutation that rolls back on error.',
    file: 'src/router.tsx',
    code: `
export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000 } },
  })
  const router = createRouter({ routeTree, context: { queryClient } })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}`,
    live: <Link to="/" className="link">Home page loader</Link>,
  },
  {
    id: 'streaming',
    title: 'Streaming SSR',
    body: 'Return a promise from a loader without awaiting it. On the first page load, Start sends the page right away and streams each result into the same HTTP response when it resolves; `<Await>` fills in each slow panel. On client-side navigation, each promise resolves as its own request.',
    file: 'src/routes/stats.tsx',
    code: `
loader: async () => ({
  hourly: getHourlyActivity(),        // streamed later
  summary: await getStatsSummary(),   // in the first flush
}),

<Suspense fallback={<ChartSkeleton />}>
  <Await promise={hourly}>{(data) => <HourlyChart data={data} />}</Await>
</Suspense>`,
    live: <Link to="/stats" className="link">/stats</Link>,
  },
  {
    id: 'selective-ssr',
    title: 'Selective SSR',
    body: "Each route chooses how it renders with its `ssr` option: `true` (the default), `'data-only'` (loader on the server, component in the browser), or `false` (client only). The kiosk board needs the window size and the Fullscreen API, so it is data-only.",
    file: 'src/routes/board.live.tsx',
    code: `
export const Route = createFileRoute('/board/live')({
  ssr: 'data-only',
  loader: ({ context: { queryClient } }) =>
    queryClient.query(departuresQuery(KIOSK)),
  component: Kiosk,
})`,
    live: <Link to="/board/live" className="link">/board/live</Link>,
  },
  {
    id: 'server-routes',
    title: 'Server routes',
    body: 'Add a `server.handlers` object to a route file and it becomes a raw HTTP endpoint — any method, any Response. This app exposes a public JSON API with cache headers (ready for Railway’s CDN), and the health check Railway uses to gate deploys.',
    file: 'src/routes/api/health.ts',
    code: `
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        // … returns 503 if the database is unreachable
        await getDb().execute(sql\`select 1\`)
        return Response.json({ status: 'ok' })
      },
    },
  },
})`,
    live: (
      <a href="/api/departures" className="link">
        /api/departures
      </a>
    ),
  },
  {
    id: 'middleware',
    title: 'Middleware',
    body: '`src/start.ts` registers global middleware. Request middleware wraps every page render, server route and server function request — here it adds a Server-Timing header you can see in devtools. Function middleware wraps every server function call, including direct calls during SSR. Exporting a `startInstance` replaces Start’s default CSRF protection, so it’s added explicitly.',
    file: 'src/start.ts',
    code: `
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, requestTimingMiddleware],
  functionMiddleware: [serverFnLogMiddleware],
}))`,
  },
  {
    id: 'sessions',
    title: 'Sessions & server-only code',
    body: '`useSession` stores an encrypted cookie, here just an anonymous visitor id so you can delete your own posts. Files named `*.server.ts` are blocked from the client bundle by Start’s import protection (the build fails if one leaks), and `createServerOnlyFn` throws if called in the browser.',
    file: 'src/server/session.server.ts',
    code: `
export function useVisitorSession() {
  return useSession<{ visitorId?: string }>({
    name: 'departures-session',
    password: process.env.SESSION_SECRET!, // 32+ characters
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
}`,
  },
  {
    id: 'head',
    title: 'Head, errors & not-found',
    body: 'Every route can set its own `<title>` and meta tags from loader data. Throwing `notFound()` from a loader or server function renders the nearest `notFoundComponent`; errors render the `errorComponent`.',
    file: 'src/routes/board.$id.tsx',
    code: `
head: ({ loaderData }) => ({
  meta: loaderData
    ? seo({ title: \`\${loaderData.name} → \${loaderData.destination}\` })
    : seo({ title: 'Ticket not found' }),
}),
notFoundComponent: () => <NotFound>This ticket doesn’t exist.</NotFound>,`,
    live: (
      <Link to="/board/$id" params={{ id: 999999 }} className="link">
        A ticket that doesn’t exist
      </Link>
    ),
  },
  {
    id: 'prerender',
    title: 'Static prerendering',
    body: 'This page has no request-time data, so it is rendered to HTML during `vite build` and served as a static file. Everything else is rendered per request by the same Node server. It uses Nitro’s prerenderer: Start’s own `prerender` option currently writes its HTML after Nitro has listed its static files, so Nitro wouldn’t serve it (TanStack/router#7473).',
    file: 'vite.config.ts',
    code: `
nitro({
  prerender: { routes: ['/features'], crawlLinks: false },
})`,
  },
]

const RAILWAY = [
  {
    title: 'Postgres on the private network',
    body: '`DATABASE_URL` points at Postgres over `railway.internal`, Railway’s private network: lower latency, and no egress charges.',
  },
  {
    title: 'Migrations before traffic',
    body: 'Every deploy runs `node scripts/migrate.mjs` as a pre-deploy command, between build and deploy, so the new version only starts once migrations succeed. It’s declared in `.railway/railway.ts`.',
  },
  {
    title: 'Health-checked deploys',
    body: 'New deployments must pass `/api/health` before Railway switches traffic, so a deploy that can’t reach its database never replaces a working one.',
  },
  {
    title: 'A real, long-running server',
    body: 'Connection pools, in-memory rate limits and streaming responses work the way they do on your laptop. Requests can keep streaming for up to 15 minutes.',
  },
]

// Renders `backticked` spans as inline code.
function inlineCode(text: string) {
  return text.split(/`([^`]+)`/g).map((part, i) =>
    i % 2 ? (
      <code
        key={i}
        className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
      >
        {part}
      </code>
    ) : (
      part
    ),
  )
}

function FeaturesPage() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 pt-14 sm:px-6">
      <PageHeader eyebrow="Prerendered at build time" title="How it’s built">
        A short tour of every TanStack Start feature this app uses, with the
        code that does it. Each section links to the live example and its
        source file.
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 border-l border-line">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-4 text-[13px] text-fg-muted transition hover:border-fg-subtle hover:text-fg"
                >
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#railway"
                className="-ml-px block border-l border-transparent py-1 pl-4 text-[13px] text-fg-muted transition hover:border-fg-subtle hover:text-fg"
              >
                On Railway
              </a>
            </li>
          </ol>
        </nav>

        <div className="min-w-0 space-y-16">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="space-y-5">
                <div className="max-w-2xl">
                  <p className="font-mono text-[12px] text-fg-subtle">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-tight">
                    {s.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                    {typeof s.body === 'string' ? inlineCode(s.body) : s.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] [&_.link]:text-accent-fg [&_.link]:underline [&_.link]:decoration-accent-fg/30 [&_.link]:underline-offset-4 [&_.link:hover]:decoration-accent-fg">
                    {s.live && <span>Live: {s.live}</span>}
                    <a
                      href={site.sourceUrl(s.file)}
                      className="text-fg-subtle hover:text-fg"
                    >
                      Source ↗
                    </a>
                  </div>
                </div>
                <Code code={s.code} file={s.file} />
              </div>
            </section>
          ))}

          <section id="railway" className="scroll-mt-24">
            <h2 className="headline text-[32px] leading-tight">
              And on Railway
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {RAILWAY.map((r) => (
                <div key={r.title} className="card p-5">
                  <h3 className="text-[15px] font-semibold">{r.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                    {inlineCode(r.body)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
