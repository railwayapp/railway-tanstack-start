import { useSuspenseQuery } from '@tanstack/react-query'
import { infraQuery } from '~/lib/queries'

function formatUptime(s: number) {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  const h = Math.floor(s / 3600)
  if (h < 48) return `${h}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

function Row({
  label,
  children,
  mono = true,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-fg-subtle">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right text-[13px] text-fg ${mono ? 'font-mono' : ''}`}
      >
        {children}
      </dd>
    </div>
  )
}

const short = (v: string | null, n = 8) => (v ? v.slice(0, n) : '—')

export function InfraCard() {
  // Prefetched by the route loader during SSR, so this never suspends on
  // first render. "Refresh" re-runs the server function from the browser.
  const { data: infra, refetch, isFetching } = useSuspenseQuery(infraQuery())
  const latency = infra.db.latencyMs

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span
              className={`pulse-dot absolute inset-0 rounded-full ${infra.onRailway ? 'bg-success' : 'bg-info'}`}
            />
          </span>
          <h3 className="text-[15px] font-semibold">
            {infra.onRailway ? 'Live from Railway' : 'Running locally'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md px-2 py-1 font-mono text-[11px] tracking-wider text-fg-subtle uppercase transition hover:bg-hairline hover:text-fg disabled:opacity-60"
        >
          {isFetching ? 'Pinging…' : 'Refresh'}
        </button>
      </div>

      <dl className="divide-y divide-line px-5">
        <Row label="Region">{infra.region}</Row>
        <Row label="Service">
          {infra.serviceName}
          <span className="text-fg-subtle"> · {infra.environmentName}</span>
        </Row>
        <Row label="Deployment">{short(infra.deploymentId)}</Row>
        <Row label="Replica">{short(infra.replicaId)}</Row>
        <Row label="Commit">
          {infra.commitSha ? (
            <span title={infra.commitMessage ?? undefined}>
              {short(infra.commitSha, 7)}
              {infra.branch && (
                <span className="text-fg-subtle"> on {infra.branch}</span>
              )}
            </span>
          ) : (
            '—'
          )}
        </Row>
        <Row label="Postgres">
          {infra.db.error ? (
            <span className="text-danger">unreachable</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {infra.db.privateNetwork && (
                <span className="rounded bg-accent-bg px-1.5 py-px text-[10px] tracking-wide text-accent-fg uppercase">
                  private network
                </span>
              )}
              <span>
                {latency !== null ? `${latency.toFixed(2)} ms` : '—'}
              </span>
            </span>
          )}
        </Row>
        <Row label="Server uptime">
          {formatUptime(infra.uptimeSeconds)}
          <span className="text-fg-subtle"> · Node {infra.nodeVersion}</span>
        </Row>
      </dl>

      {!infra.onRailway && (
        <p className="border-t border-line bg-info-bg/60 px-5 py-3 text-[13px] text-fg-muted">
          Deploy to Railway to see your region, deployment, and private-network
          database latency here.
        </p>
      )}
      {infra.db.error && (
        <p className="border-t border-line px-5 py-3 font-mono text-[12px] text-danger">
          {infra.db.error}
        </p>
      )}
    </div>
  )
}
