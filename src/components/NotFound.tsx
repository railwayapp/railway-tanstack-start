import { Link } from '@tanstack/react-router'
import { SplitFlap } from './SplitFlap'

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="rounded-2xl bg-board px-6 py-5 ring-1 ring-white/10">
        <SplitFlap
          text="CANCELLED"
          className="text-[22px] text-board-time sm:text-[28px]"
        />
      </div>
      <h1 className="headline mt-8 text-[36px] leading-tight">
        Looks like you missed this train.
      </h1>
      <p className="mt-3 text-[17px] text-fg-muted">
        {children ?? 'The page you’re looking for has left the station, or never arrived.'}
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/board" className="btn-primary">
          View departures
        </Link>
        <Link to="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  )
}
