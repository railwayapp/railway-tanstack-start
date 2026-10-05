import { Link, useHydrated } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RailwayLogo } from './Logo'
import { SplitFlap } from './SplitFlap'
import type { Departure } from '~/lib/destinations'
import { statusOf } from '~/lib/destinations'

/**
 * Times render in UTC on the server (it can't know your timezone), then
 * switch to local time once hydrated — the flaps animate the change.
 */
export function useBoardTime(iso: string) {
  const hydrated = useHydrated()
  const d = new Date(iso)
  return hydrated
    ? d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : d.toISOString().slice(11, 16)
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function BoardClock() {
  const hydrated = useHydrated()
  const now = useNow(1000)
  if (!hydrated) return <span className="tabular-nums">--:--:--</span>
  return (
    <span className="tabular-nums">
      {new Date(now).toLocaleTimeString([], { hour12: false })}
    </span>
  )
}

export function StatusPill({ createdAt }: { createdAt: string }) {
  const now = useNow(30_000)
  const status = statusOf(createdAt, now)
  return status === 'boarding' ? (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-board-go">
      <span className="pulse-dot size-1.5 rounded-full bg-board-go" />
      BOARDING
    </span>
  ) : (
    <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-board-dim">
      DEPARTED
    </span>
  )
}

function BoardRow({
  departure,
  index,
  pending,
}: {
  departure: Departure
  index: number
  pending?: boolean
}) {
  const time = useBoardTime(departure.createdAt)
  return (
    <li
      className={`row-in group relative ${pending ? 'opacity-60' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link
        to="/board/$id"
        params={{ id: departure.id }}
        disabled={pending}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:grid-cols-[auto_auto_1fr_auto_auto] sm:px-6"
      >
        <SplitFlap
          text={time}
          length={5}
          delay={index * 60}
          className="text-[13px] text-board-time sm:text-[15px]"
        />
        <SplitFlap
          text={departure.destination}
          length={13}
          delay={index * 60 + 120}
          className="text-[13px] text-board-ink sm:text-[15px]"
        />
        <div className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
          <p className="line-clamp-2 text-[14px] leading-snug text-board-ink/90">
            {departure.message}
          </p>
          <p className="truncate font-mono text-[11px] text-board-dim">
            {departure.name}
            {departure.mine && (
              <span className="ml-2 rounded bg-white/10 px-1.5 py-px text-[10px] text-board-ink">
                YOU
              </span>
            )}
          </p>
        </div>
        <span className="col-start-3 row-start-1 flex items-center gap-3 justify-self-end sm:col-start-auto sm:row-start-auto">
          <span className="hidden font-mono text-[10px] tracking-[0.14em] text-board-dim sm:inline">
            PLAT
          </span>
          <SplitFlap
            text={departure.platform ? String(departure.platform) : '·'}
            length={1}
            delay={index * 60 + 200}
            className="text-[13px] text-board-ink sm:text-[15px]"
          />
        </span>
        <span className="col-span-3 row-start-3 sm:col-span-1 sm:row-start-auto sm:w-24 sm:text-right">
          <StatusPill createdAt={departure.createdAt} />
        </span>
      </Link>
    </li>
  )
}

export function DepartureBoard({
  departures,
  title = 'Departures',
  footer,
  pendingIds = [],
}: {
  departures: Array<Departure>
  title?: string
  footer?: React.ReactNode
  pendingIds?: Array<number>
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-2xl bg-board text-board-ink shadow-[0_24px_60px_-20px_rgb(13_12_20/0.6)] ring-1 ring-white/10"
    >
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-board-row px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <RailwayLogo className="size-5 text-board-ink" />
          <h2 className="font-mono text-[13px] font-semibold tracking-[0.2em] uppercase">
            {title}
          </h2>
        </div>
        <div className="font-mono text-[13px] text-board-time">
          <BoardClock />
        </div>
      </header>
      <div className="hidden grid-cols-[auto_auto_1fr_auto_auto] gap-x-4 border-b border-white/5 px-6 py-2 font-mono text-[10px] tracking-[0.18em] text-board-dim sm:grid">
        <span className="w-[calc(5*1.05em+8px)] text-[15px]">
          <span className="text-[10px]">TIME</span>
        </span>
        <span className="w-[calc(13*1.05em+24px)] text-[15px]">
          <span className="text-[10px]">DESTINATION</span>
        </span>
        <span>MESSAGE</span>
        <span>PLATFORM</span>
        <span className="w-24 text-right">STATUS</span>
      </div>
      {departures.length === 0 ? (
        <p className="px-6 py-12 text-center font-mono text-sm text-board-dim">
          NO SCHEDULED DEPARTURES
        </p>
      ) : (
        <ol className="divide-y divide-white/[0.06]">
          {departures.map((d, i) => (
            <BoardRow
              key={d.id}
              departure={d}
              index={i}
              pending={d.id < 0 || pendingIds.includes(d.id)}
            />
          ))}
        </ol>
      )}
      {footer && (
        <footer className="border-t border-white/10 bg-board-row px-4 py-3 sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  )
}

export function BoardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-board ring-1 ring-white/10">
      <div className="h-12 border-b border-white/10 bg-board-row" />
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/[0.06] px-6 py-4"
        >
          <div className="h-6 w-16 rounded bg-board-cell" />
          <div className="h-6 w-48 rounded bg-board-cell" />
          <div className="h-4 flex-1 rounded bg-board-cell/60" />
        </div>
      ))}
    </div>
  )
}
