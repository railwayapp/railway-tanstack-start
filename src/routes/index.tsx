import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { DepartureBoard } from '~/components/DepartureBoard'
import { HeroDiagram } from '~/components/HeroDiagram'
import { InfraCard } from '~/components/InfraCard'
import { departuresQuery, infraQuery } from '~/lib/queries'
import { site } from '~/lib/site'

const PREVIEW = { pageSize: 6 }

export const Route = createFileRoute('/')({
  // The page marks which departures this visitor posted, so it's private to them.
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  // Runs on the server for the first request and on the client for
  // subsequent navigations. Both queries are fetched in parallel and
  // dehydrated into the HTML stream.
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.query(departuresQuery(PREVIEW)),
      queryClient.query(infraQuery()),
    ]),
  component: Home,
})

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <section className="mx-auto mt-28 grid max-w-[1160px] gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <LivePreview />
        <div className="space-y-6">
          <InfraCard />
          <p className="px-1 text-[13px] leading-relaxed text-fg-subtle">
            This card’s data comes from a server function, fetched fresh on
            each page load. Redeploy and watch the deployment ID change.
          </p>
        </div>
      </section>
      <MakeItYours />
    </>
  )
}

function Hero() {
  return (
    <section className="px-2 sm:px-4">
      <div className="relative isolate mx-auto flex min-h-[620px] max-w-[1696px] items-start overflow-hidden rounded-2xl lg:min-h-[740px] dark:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.2)]">
        {/* Anchored to the bottom so the train and fields are never cropped;
            content sits in the sky above the train. */}
        <picture className="absolute inset-0 -z-10 hidden dark:block">
          <source media="(max-width: 960px)" srcSet="/hero/bg-train-dusk-960.webp" />
          <img
            src="/hero/bg-train-dusk.webp"
            alt=""
            className="size-full object-cover object-bottom"
            fetchPriority="high"
          />
        </picture>
        <picture className="absolute inset-0 -z-10 dark:hidden">
          <source media="(max-width: 960px)" srcSet="/hero/bg-train-day-960.webp" />
          <img
            src="/hero/bg-train-day.webp"
            alt=""
            className="size-full object-cover object-[50%_75%]"
          />
        </picture>
        {/* Dim the whole image, then deepen behind the copy for contrast. */}
        <div className="absolute inset-0 -z-10 bg-[#0d0c14]/35 dark:bg-[#0d0c14]/50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0c14]/70 via-[#0d0c14]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/4 bg-gradient-to-t from-[#0d0c14]/40 to-transparent" />

        <div className="mx-auto grid w-full max-w-[1160px] items-start gap-12 px-6 pt-16 pb-48 sm:px-10 lg:grid-cols-[1fr_400px] lg:pt-20">
          <div className="lg:pt-6">
            <span className="badge bg-white/[0.12] text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="pulse-dot size-1.5 rounded-full bg-[#42946E]" />
              TanStack Start 1.0 · Live on Railway
            </span>
            <h1 className="headline mt-5 max-w-2xl text-[40px] leading-[1.08] tracking-[-0.035em] text-white sm:text-[60px]">
              Your app has left the station.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.6] font-medium text-white/75 sm:text-[18px]">
              A full-stack TanStack Start app with a Postgres database on
              Railway’s private network. Post to the board, look around, then
              make it yours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/board" className="btn-primary !px-6 !py-3">
                Post to the board
              </Link>
              <Link to="/features" className="btn-ghost-light !px-6 !py-3">
                How it’s built
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-end lg:block">
            <HeroDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}

function LivePreview() {
  const { data } = useSuspenseQuery(departuresQuery(PREVIEW))
  return (
    <DepartureBoard
      departures={data.items}
      title="Live departures"
      footer={
        <div className="flex items-center justify-between font-mono text-[12px] text-board-dim">
          <span>
            {data.total} {data.total === 1 ? 'DEPARTURE' : 'DEPARTURES'} ·
            POSTGRES
          </span>
          <Link
            to="/board"
            className="text-board-ink transition hover:text-board-time"
          >
            ALL DEPARTURES →
          </Link>
        </div>
      }
    />
  )
}

const FEATURES = [
  {
    title: 'Server functions',
    body: 'Type-safe RPCs with zod validation. Posting to the board calls a server function — no API layer to write.',
    tag: 'createServerFn',
    to: '/board',
  },
  {
    title: 'Type-safe search params',
    body: 'Filters and pagination live in the URL, validated with a schema and fully typed in every Link.',
    tag: 'validateSearch',
    to: '/board',
    search: { dest: 'Tokyo' },
  },
  {
    title: 'Streaming SSR',
    body: 'The stats page sends its shell right away and streams slow queries into the same response.',
    tag: '<Await>',
    to: '/stats',
  },
  {
    title: 'Selective SSR',
    body: 'The kiosk view loads data on the server but renders only in the browser, where it can size itself.',
    tag: "ssr: 'data-only'",
    to: '/board/live',
  },
  {
    title: 'Server routes',
    body: 'Plain HTTP handlers next to your pages. A public JSON API and the Railway health check.',
    tag: 'server.handlers',
    href: '/api/departures',
  },
  {
    title: 'Static prerendering',
    body: 'The features page is rendered to HTML at build time and served as a static file.',
    tag: 'prerender',
    to: '/features',
  },
  {
    title: 'Middleware',
    body: 'Global request middleware adds Server-Timing headers; function middleware logs every server function call.',
    tag: 'createMiddleware',
    to: '/features',
    hash: 'middleware',
  },
  {
    title: 'TanStack Query, SSR’d',
    body: 'Loaders prefetch queries on the server, then hydrate them — with optimistic updates on post.',
    tag: 'ssr-query',
    to: '/board',
  },
] as const

function Features() {
  return (
    <section className="mx-auto mt-20 max-w-[1160px] px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="eyebrow">What’s inside</p>
        <h2 className="headline mt-3 text-[36px] leading-[1.15] tracking-[-0.02em]">
          The core features of TanStack Start, in one small app.
        </h2>
      </div>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const inner = (
            <>
              <span className="self-start rounded-md bg-accent-bg px-2 py-0.5 font-mono text-[11px] text-accent-fg">
                {f.tag}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                {f.body}
              </p>
              <span className="mt-auto pt-5 text-[13px] text-fg-subtle transition group-hover:text-accent-fg">
                See it →
              </span>
            </>
          )
          const className =
            'group flex flex-col bg-surface p-6 transition-colors hover:bg-surface-raised'
          return 'href' in f ? (
            <a key={f.title} href={f.href} className={className}>
              {inner}
            </a>
          ) : (
            <Link
              key={f.title}
              to={f.to}
              search={'search' in f ? f.search : undefined}
              hash={'hash' in f ? f.hash : undefined}
              className={className}
            >
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function MakeItYours() {
  return (
    <section className="mx-auto mt-28 max-w-[1160px] px-4 sm:px-6">
      <div className="dot-grid relative overflow-hidden rounded-2xl border border-line bg-surface p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Next stop</p>
            <h2 className="headline mt-3 text-[36px] leading-[1.15] tracking-[-0.02em]">
              Make it yours.
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-fg-muted">
              Eject the service to copy the repo into your GitHub account,
              clone it, and start editing. Pushes to the connected branch
              deploy automatically, and with PR environments turned on in
              project settings, each pull request gets its own preview.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={site.repoUrl} className="btn-primary">
                View source
              </a>
              <a
                href="https://docs.railway.com/guides/tanstack-start"
                className="btn-secondary"
              >
                Read the guide
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl bg-board font-mono text-[13px] leading-[1.9] text-board-ink shadow-dreamy ring-1 ring-white/10">
            <div className="flex gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <pre className="overflow-x-auto px-5 py-4">
              <span className="text-board-dim"># run it locally with a Docker Postgres</span>
              {'\n'}
              <span className="text-board-time">$</span> pnpm install && cp .env.example .env
              {'\n'}
              <span className="text-board-time">$</span> pnpm db:up && pnpm db:migrate
              {'\n'}
              <span className="text-board-time">$</span> pnpm dev
              {'\n\n'}
              <span className="text-board-dim"># edit src/routes/index.tsx, then</span>
              {'\n'}
              <span className="text-board-time">$</span> git push{' '}
              <span className="text-board-go">→ deploying…</span>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
