import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { BoardSkeleton, DepartureBoard } from '~/components/DepartureBoard'
import { PostForm } from '~/components/PostForm'
import { PageHeader } from '~/components/SiteChrome'
import { DESTINATIONS, destinationSchema } from '~/lib/destinations'
import { departuresQuery } from '~/lib/queries'
import { seo } from '~/lib/seo'

// Search params are validated and typed. `/board?dest=Tokyo&page=2` parses
// to { dest: 'Tokyo', page: 2 }; bad values fall back instead of throwing.
const searchSchema = z.object({
  dest: destinationSchema.optional().catch(undefined),
  page: z.number().int().min(1).default(1).catch(1),
})

export const Route = createFileRoute('/board/')({
  // The page marks which departures this visitor posted, so it's private to them.
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.query(departuresQuery(deps)),
  head: ({ match }) => ({
    meta: seo({
      title: match.search.dest
        ? `Departures to ${match.search.dest}`
        : 'Departure board',
    }),
  }),
  pendingComponent: () => (
    <div className="mx-auto max-w-[1160px] px-4 pt-14 sm:px-6">
      <BoardSkeleton rows={8} />
    </div>
  ),
  component: BoardPage,
})

function BoardPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useSuspenseQuery(departuresQuery(search))

  return (
    <div className="mx-auto max-w-[1160px] px-4 pt-14 sm:px-6">
      <PageHeader eyebrow="Platform 1–9" title="Departure board">
        Every row is a message someone left on this app, stored in Postgres.
        Filters and pages live in the URL, so any view is shareable.
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <DestinationFilter active={search.dest} />
          <DepartureBoard
            departures={data.items}
            title={search.dest ? `To ${search.dest}` : 'All departures'}
            footer={
              <Pagination page={data.page} pageCount={data.pageCount} total={data.total} />
            }
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <PostForm
            onPosted={() =>
              navigate({ search: (prev) => ({ ...prev, page: 1 }) })
            }
          />
          <Link
            to="/board/live"
            className="card flex items-center justify-between gap-4 p-5 transition hover:border-accent-strong/50"
          >
            <div>
              <p className="text-[15px] font-semibold">Kiosk mode</p>
              <p className="mt-1 text-[13px] text-fg-muted">
                A full-screen, auto-refreshing board for the office TV.
              </p>
            </div>
            <span className="text-fg-subtle">→</span>
          </Link>
        </aside>
      </div>
    </div>
  )
}

function DestinationFilter({ active }: { active?: string }) {
  const chip =
    'shrink-0 rounded-full border px-3 py-1 text-[13px] transition whitespace-nowrap'
  const on = 'border-accent-strong bg-accent-bg text-accent-fg'
  const off = 'border-line text-fg-muted hover:border-fg-subtle hover:text-fg'
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      <Link
        to="/board"
        search={{ page: 1 }}
        className={`${chip} ${!active ? on : off}`}
      >
        All
      </Link>
      {DESTINATIONS.map((d) => (
        <Link
          key={d}
          to="/board"
          search={{ dest: d, page: 1 }}
          className={`${chip} ${active === d ? on : off}`}
        >
          {d}
        </Link>
      ))}
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  total,
}: {
  page: number
  pageCount: number
  total: number
}) {
  const btn =
    'rounded-md px-2.5 py-1 text-board-ink transition hover:bg-white/10 aria-disabled:pointer-events-none aria-disabled:opacity-30 data-[disabled]:opacity-30'
  return (
    <div className="flex items-center justify-between font-mono text-[12px] text-board-dim">
      <span>
        {total} {total === 1 ? 'DEPARTURE' : 'DEPARTURES'}
      </span>
      <div className="flex items-center gap-2">
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: page - 1 })}
          disabled={page <= 1}
          className={btn}
        >
          ← PREV
        </Link>
        <span className="tabular-nums">
          {page}/{pageCount}
        </span>
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: page + 1 })}
          disabled={page >= pageCount}
          className={btn}
        >
          NEXT →
        </Link>
      </div>
    </div>
  )
}
