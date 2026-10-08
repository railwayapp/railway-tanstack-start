import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { StatusPill, useBoardTime } from '~/components/DepartureBoard'
import { RailwayLogo } from '~/components/Logo'
import { NotFound } from '~/components/NotFound'
import { SplitFlap } from '~/components/SplitFlap'
import { departureQuery } from '~/lib/queries'
import { seo } from '~/lib/seo'
import { deleteDeparture } from '~/server/departures.functions'

export const Route = createFileRoute('/board/$id')({
  // The page marks which departures this visitor posted, so it's private to them.
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  // Path params are parsed and typed: `id` is a number everywhere below.
  params: {
    parse: ({ id }) => {
      const n = Number(id)
      if (!Number.isInteger(n) || n <= 0) throw notFound()
      return { id: n }
    },
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: ({ context: { queryClient }, params }) =>
    queryClient.query(departureQuery(params.id)),
  // Per-page <title> and Open Graph tags, built from loader data.
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: `${loaderData.name} → ${loaderData.destination}`,
          description: `“${loaderData.message}” — ticket #${loaderData.id} on the departure board.`,
        })
      : seo({ title: 'Ticket not found' }),
  }),
  notFoundComponent: () => (
    <NotFound>This ticket doesn’t exist, or its owner tore it up.</NotFound>
  ),
  component: TicketPage,
})

function TicketPage() {
  const { id } = Route.useParams()
  const { data: d } = useSuspenseQuery(departureQuery(id))
  const time = useBoardTime(d.createdAt)
  const date = new Date(d.createdAt).toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
      <Link
        to="/board"
        className="text-[14px] text-fg-muted transition hover:text-fg"
      >
        ← Back to the board
      </Link>

      <article className="row-in mt-6 flex flex-col overflow-hidden rounded-2xl bg-board text-board-ink shadow-[0_30px_80px_-30px_rgb(13_12_20/0.7)] ring-1 ring-white/10 sm:flex-row">
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RailwayLogo className="size-5" />
              <span className="font-mono text-[12px] font-semibold tracking-[0.2em]">
                BOARDING PASS
              </span>
            </div>
            <StatusPill createdAt={d.createdAt} />
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em] text-board-dim">
                FROM
              </p>
              <p className="mt-2 font-mono text-[18px] font-semibold sm:text-[22px]">
                {d.region === 'seed' ? 'ORIGIN' : d.region.toUpperCase()}
              </p>
            </div>
            <svg viewBox="0 0 48 16" className="mb-2 w-12 text-board-time" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 8h44M38 2l6 6-6 6" />
            </svg>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-[0.18em] text-board-dim">
                TO
              </p>
              <div className="mt-2">
                <SplitFlap
                  text={d.destination}
                  className="text-[14px] text-board-ink sm:text-[18px]"
                />
              </div>
            </div>
          </div>

          <blockquote className="mt-10 font-serif text-[24px] leading-snug text-balance sm:text-[28px]">
            “{d.message}”
          </blockquote>
          <p className="mt-3 font-mono text-[13px] text-board-dim">
            — {d.name}
          </p>
        </div>

        {/* Perforated stub */}
        <div className="relative border-t-2 border-dashed border-white/15 p-6 sm:w-56 sm:border-t-0 sm:border-l-2 sm:p-8">
          <span className="absolute -top-3 -left-3 size-6 rounded-full bg-canvas sm:-top-3 sm:-left-3" />
          <span className="absolute -top-3 -right-3 size-6 rounded-full bg-canvas sm:top-auto sm:-bottom-3 sm:-left-3 sm:right-auto" />
          <dl className="grid grid-cols-3 gap-4 font-mono sm:grid-cols-1">
            <div>
              <dt className="text-[10px] tracking-[0.18em] text-board-dim">TIME</dt>
              <dd className="mt-1.5">
                <SplitFlap text={time} length={5} className="text-[15px] text-board-time" />
              </dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.18em] text-board-dim">PLATFORM</dt>
              <dd className="mt-1.5">
                <SplitFlap text={String(d.platform)} className="text-[15px]" />
              </dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.18em] text-board-dim">TICKET</dt>
              <dd className="mt-1.5 text-[15px] tabular-nums">
                #{String(d.id).padStart(4, '0')}
              </dd>
            </div>
            <div className="hidden sm:block">
              <dt className="text-[10px] tracking-[0.18em] text-board-dim">DATE</dt>
              <dd className="mt-1.5 text-[13px]">{date}</dd>
            </div>
          </dl>
        </div>
      </article>

      <TicketActions id={d.id} mine={d.mine} />
    </div>
  )
}

function TicketActions({ id, mine }: { id: number; mine: boolean }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const remove = useServerFn(deleteDeparture)
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['departure', id] })
      // Drop the row from every cached list so the board never flashes it,
      // then mark the lists stale so they refetch in the background.
      queryClient.setQueriesData<{ items: Array<{ id: number }>; total: number }>(
        { queryKey: ['departures'] },
        (old) =>
          old && {
            ...old,
            items: old.items.filter((d) => d.id !== id),
            total: old.total - 1,
          },
      )
      queryClient.invalidateQueries({ queryKey: ['departures'] })
      router.navigate({ to: '/board' })
    },
  })

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }}
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      {mine && (
        <button
          type="button"
          className="btn border border-danger/30 text-danger hover:bg-danger/10"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Tearing up…' : 'Tear up ticket'}
        </button>
      )}
      {mutation.isError && (
        <span className="text-[13px] text-danger">{mutation.error.message}</span>
      )}
    </div>
  )
}
