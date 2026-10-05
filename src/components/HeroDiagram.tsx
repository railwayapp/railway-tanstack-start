import { useSuspenseQuery } from '@tanstack/react-query'
import { RailwayLogo } from './Logo'
import { infraQuery } from '~/lib/queries'

/**
 * A live architecture diagram of this app, styled after the Railway canvas.
 * Region and database latency come from the same server function as the
 * infra card, so the diagram reflects the deployment that rendered it.
 */
export function HeroDiagram() {
  const { data: infra } = useSuspenseQuery(infraQuery())
  const latency =
    infra.db.latencyMs !== null ? `${infra.db.latencyMs.toFixed(2)} ms` : '—'

  return (
    <div
      aria-label="Architecture: browser to TanStack Start on Railway to Postgres"
      className="relative w-full max-w-[400px] rounded-2xl bg-black/35 p-4 ring-1 ring-white/15 backdrop-blur-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/60 uppercase">
          <RailwayLogo className="size-3.5 text-white/80" />
          {infra.onRailway ? `${infra.environmentName} · ${infra.region}` : 'local'}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-[#7fd1a8] uppercase">
          <span className="pulse-dot size-1.5 rounded-full bg-[#42946E]" />
          Live
        </span>
      </div>

      <Node
        icon={<GlobeIcon />}
        title="Browser"
        subtitle="React 19 · hydrated"
      />

      <Connector label="HTTPS" detail="Railway edge" />

      <Node
        icon={<StackIcon />}
        title={infra.serviceName === 'local' ? 'web' : infra.serviceName}
        subtitle="TanStack Start · Node"
        status={infra.onRailway ? 'Online' : 'Local'}
        highlight
      >
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['SSR + streaming', 'Server functions', 'Server routes', 'Middleware'].map(
            (chip) => (
              <span
                key={chip}
                className="rounded-md bg-white/[0.07] px-2 py-0.5 font-mono text-[10.5px] text-white/75 ring-1 ring-white/10"
              >
                {chip}
              </span>
            ),
          )}
        </div>
      </Node>

      <Connector
        label={infra.db.privateNetwork ? 'Private network' : 'TCP'}
        detail={latency}
        accent
      />

      <Node
        icon={<DatabaseIcon />}
        title="Postgres"
        subtitle={
          infra.db.privateNetwork ? `${infra.db.host}` : 'Drizzle ORM · migrations on deploy'
        }
        status={infra.db.error ? 'Unreachable' : 'Online'}
        error={Boolean(infra.db.error)}
      />
    </div>
  )
}

function Node({
  icon,
  title,
  subtitle,
  status,
  highlight,
  error,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  status?: string
  highlight?: boolean
  error?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`relative rounded-xl p-3 ring-1 ${
        highlight
          ? 'bg-[#1e132a]/80 shadow-[0_0_40px_-8px_rgba(166,103,228,0.55)] ring-[#a667e4]/45'
          : 'bg-[#13111c]/80 ring-white/12'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-white ring-1 ring-white/10">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">{title}</p>
          <p className="truncate font-mono text-[11px] text-white/55">{subtitle}</p>
        </div>
        {status && (
          <span
            className={`flex shrink-0 items-center gap-1.5 text-[11px] ${error ? 'text-[#e2625e]' : 'text-[#7fd1a8]'}`}
          >
            <span
              className={`size-1.5 rounded-full ${error ? 'bg-[#e2625e]' : 'bg-[#42946E]'}`}
            />
            {status}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Connector({
  label,
  detail,
  accent,
}: {
  label: string
  detail: string
  accent?: boolean
}) {
  const color = accent ? '#bf92ec' : 'rgba(255,255,255,0.55)'
  return (
    <div className="relative flex h-11 items-center pl-[30px]">
      {/* the wire */}
      <svg
        className="absolute top-0 left-[29px] h-full w-[3px] overflow-visible"
        aria-hidden="true"
      >
        <line
          x1="1.5"
          y1="0"
          x2="1.5"
          y2="100%"
          stroke={color}
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          className="wire-flow"
        />
      </svg>
      {/* packets: request down, response up */}
      <span
        aria-hidden="true"
        className="packet-down absolute left-[27px] size-[7px] rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
      <span
        aria-hidden="true"
        className="packet-up absolute left-[27px] size-[7px] rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
      <span className="ml-6 flex items-center gap-2 font-mono text-[10.5px]">
        <span className={accent ? 'text-[#d7bdf3]' : 'text-white/60'}>{label}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/85 tabular-nums">{detail}</span>
      </span>
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  )
}

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 17 9 5 9-5" opacity=".5" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
      <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </svg>
  )
}
