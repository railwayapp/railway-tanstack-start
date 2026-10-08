import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BoardClock, StatusPill, useBoardTime } from '~/components/DepartureBoard'
import { RailwayLogo } from '~/components/Logo'
import { SplitFlap } from '~/components/SplitFlap'
import type { Departure } from '~/lib/destinations'
import { departuresQuery } from '~/lib/queries'
import { seo } from '~/lib/seo'

const KIOSK = { pageSize: 14 }

export const Route = createFileRoute('/board/live')({
  // The page marks which departures this visitor posted, so it's private to them.
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  // Selective SSR: the loader runs on the server (so data arrives with the
  // HTML), but the component renders only in the browser. It sizes itself
  // to the screen and uses the Fullscreen API, neither of which exist on
  // the server.
  ssr: 'data-only',
  loader: ({ context: { queryClient } }) =>
    queryClient.query(departuresQuery(KIOSK)),
  head: () => ({ meta: seo({ title: 'Live board' }) }),
  pendingComponent: () => <div className="fixed inset-0 z-50 bg-board" />,
  component: Kiosk,
})

function useRowsThatFit(rowHeight: number, chrome: number) {
  const [rows, setRows] = useState(() =>
    Math.max(3, Math.floor((window.innerHeight - chrome) / rowHeight)),
  )
  useEffect(() => {
    const onResize = () =>
      setRows(Math.max(3, Math.floor((window.innerHeight - chrome) / rowHeight)))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [rowHeight, chrome])
  return rows
}

function Kiosk() {
  // Polls every 5s; new posts flip onto the board.
  const { data } = useSuspenseQuery({
    ...departuresQuery(KIOSK),
    refetchInterval: 5_000,
  })
  const fit = useRowsThatFit(76, 150)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-board text-board-ink">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-4">
          <RailwayLogo className="size-7" />
          <SplitFlap text="DEPARTURES" className="text-[18px] sm:text-[22px]" />
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[22px] text-board-time sm:text-[28px]">
            <BoardClock />
          </span>
          <button
            type="button"
            onClick={() =>
              document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen()
            }
            className="hidden rounded-md px-3 py-1.5 font-mono text-[11px] tracking-wider text-board-dim ring-1 ring-white/15 transition hover:text-board-ink sm:block"
          >
            FULLSCREEN
          </button>
          <Link
            to="/board"
            className="rounded-md px-3 py-1.5 font-mono text-[11px] tracking-wider text-board-dim ring-1 ring-white/15 transition hover:text-board-ink"
          >
            EXIT
          </Link>
        </div>
      </header>
      <ol className="flex-1 divide-y divide-white/[0.06] overflow-hidden">
        {data.items.slice(0, fit).map((d, i) => (
          <KioskRow key={d.id} departure={d} index={i} />
        ))}
      </ol>
      <footer className="flex justify-between border-t border-white/10 px-6 py-3 font-mono text-[11px] tracking-[0.14em] text-board-dim sm:px-10">
        <span>POST AT {typeof window !== 'undefined' ? window.location.host.toUpperCase() : ''}/BOARD</span>
        <span>REFRESHING EVERY 5S</span>
      </footer>
    </div>
  )
}

function KioskRow({ departure: d, index }: { departure: Departure; index: number }) {
  const time = useBoardTime(d.createdAt)
  return (
    <li className="grid h-[76px] grid-cols-[auto_auto_1fr_auto] items-center gap-6 px-6 sm:px-10">
      <SplitFlap text={time} length={5} delay={index * 80} className="text-[20px] text-board-time sm:text-[26px]" />
      <SplitFlap text={d.destination} length={13} delay={index * 80 + 150} className="text-[20px] sm:text-[26px]" />
      <div className="min-w-0">
        <p className="truncate text-[17px] sm:text-[20px]">{d.message}</p>
        <p className="truncate font-mono text-[12px] text-board-dim">{d.name}</p>
      </div>
      <div className="flex items-center gap-6">
        <SplitFlap text={String(d.platform)} length={1} className="hidden text-[20px] sm:inline-flex sm:text-[26px]" />
        <span className="hidden w-28 text-right md:block">
          <StatusPill createdAt={d.createdAt} />
        </span>
      </div>
    </li>
  )
}
