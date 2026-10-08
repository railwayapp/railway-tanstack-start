import { Await, Link, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageHeader } from '~/components/SiteChrome'
import type { Destination } from '~/lib/destinations'
import { seo } from '~/lib/seo'
import {
  getHourlyActivity,
  getStatsSummary,
  getTopDestinations,
} from '~/server/stats.functions'

export const Route = createFileRoute('/stats')({
  loader: async () => ({
    // Not awaited: these promises stream to the browser as they resolve,
    // in the same HTTP response. The page shell doesn't wait for them.
    topDestinations: getTopDestinations(),
    hourly: getHourlyActivity(),
    // Awaited: part of the first flush.
    summary: await getStatsSummary(),
  }),
  head: () => ({ meta: seo({ title: 'Stats' }) }),
  component: StatsPage,
})

function StatsPage() {
  const { summary, topDestinations, hourly } = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-[1160px] px-4 pt-14 sm:px-6">
      <PageHeader eyebrow="Streaming SSR" title="Traffic at the station">
        The numbers below render immediately. The two panels underneath are
        slow queries that stream in after the page has already arrived —
        reload and watch.
      </PageHeader>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        <Stat label="Departures" value={summary.total} />
        <Stat label="Last 24 hours" value={summary.lastDay} />
        <Stat label="Destinations" value={summary.destinations} />
        <Stat label="Regions served" value={summary.regions} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Activity, last 24 hours" note="~1.4s query">
          <Suspense fallback={<ChartSkeleton />}>
            <Await promise={hourly}>
              {(data) => <HourlyChart data={data} />}
            </Await>
          </Suspense>
        </Panel>
        <Panel title="Top destinations" note="~0.7s query">
          <Suspense fallback={<ListSkeleton />}>
            <Await promise={topDestinations}>
              {(data) => <TopList data={data} />}
            </Await>
          </Suspense>
        </Panel>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface p-6">
      <p className="text-[13px] text-fg-subtle">{label}</p>
      <p className="headline mt-2 text-[40px] leading-none tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function Panel({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="card p-6">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <span className="font-mono text-[11px] text-fg-subtle">{note}</span>
      </div>
      {children}
    </section>
  )
}

function HourlyChart({ data }: { data: Array<{ hour: string; total: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.total))
  return (
    <div className="row-in">
      <div className="flex h-48 items-end gap-[3px]">
        {data.map((d, i) => (
          <div
            key={d.hour}
            className="group relative flex h-full flex-1 items-end"
            title={`${new Date(d.hour).getUTCHours()}:00 UTC: ${d.total}`}
          >
            <div
              className={`w-full rounded-t-[3px] transition-colors ${d.total ? 'bg-accent-strong/70 group-hover:bg-accent-strong' : 'bg-hairline'}`}
              style={{
                height: `${Math.max(3, (d.total / max) * 100)}%`,
                transitionDelay: `${i * 15}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[11px] text-fg-subtle">
        <span>24h ago</span>
        <span>now</span>
      </div>
    </div>
  )
}

function TopList({ data }: { data: Array<{ destination: string; total: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.total))
  if (data.length === 0) {
    return <p className="text-[14px] text-fg-muted">No departures yet.</p>
  }
  return (
    <ol className="row-in space-y-3">
      {data.map((d) => (
        <li key={d.destination}>
          <Link
            to="/board"
            search={{ dest: d.destination as Destination, page: 1 }}
            className="group block"
          >
            <div className="flex justify-between text-[14px]">
              <span className="group-hover:text-accent-fg">{d.destination}</span>
              <span className="font-mono text-fg-muted tabular-nums">{d.total}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
              <div
                className="h-full rounded-full bg-accent-strong/70"
                style={{ width: `${(d.total / max) * 100}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  )
}

function ChartSkeleton() {
  return (
    <div>
      <div className="flex h-48 items-end gap-[3px]">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="skeleton flex-1"
            style={{ height: `${20 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
      <div className="mt-3 h-[17px]" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-1.5" />
        </div>
      ))}
    </div>
  )
}
