import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RailwayLogo } from './Logo'
import { ThemeToggle } from './Theme'
import { site } from '~/lib/site'

const NAV = [
  { to: '/board', label: 'Board' },
  { to: '/stats', label: 'Stats' },
  { to: '/features', label: 'Features' },
] as const

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-canvas/85 backdrop-blur-md transition-colors ${scrolled ? 'border-hairline' : 'border-transparent'}`}
    >
      <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <RailwayLogo className="size-6 transition-transform duration-500 ease-spring group-hover:-rotate-12" />
          <span className="text-[15px] font-semibold tracking-tight">
            {site.name}
          </span>
          <span className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle sm:inline">
            TanStack Start
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-1.5 text-[14px] text-fg-muted transition hover:bg-hairline hover:text-fg"
              activeProps={{ className: '!text-fg bg-hairline' }}
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
          <ThemeToggle />
          <a
            href={site.deployUrl}
            className="btn-primary ml-1 hidden !px-3.5 !py-1.5 !text-[14px] md:inline-flex"
          >
            Deploy on Railway
          </a>
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 text-[14px] text-fg-muted">
          <RailwayLogo className="size-5 text-fg" />
          <span>
            Built with{' '}
            <a
              href="https://tanstack.com/start"
              className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg"
            >
              TanStack Start
            </a>
            , deployed on{' '}
            <a
              href="https://railway.com"
              className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg"
            >
              Railway
            </a>
            .
          </span>
        </div>
        <div className="flex gap-5 text-[14px] text-fg-muted">
          <a href={site.repoUrl} className="hover:text-fg">
            Source
          </a>
          <a href="/api/departures" className="hover:text-fg">
            API
          </a>
          <a href="https://docs.railway.com" className="hover:text-fg">
            Railway docs
          </a>
          <a href="https://tanstack.com/start/latest/docs" className="hover:text-fg">
            Start docs
          </a>
        </div>
      </div>
    </footer>
  )
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="headline mt-3 text-[40px] leading-[1.1] sm:text-[48px]">
        {title}
      </h1>
      {children && (
        <p className="mt-4 text-[17px] leading-relaxed text-fg-muted">
          {children}
        </p>
      )}
    </div>
  )
}

export function FeatureTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-fg-muted">
      <span className="size-1.5 rounded-full bg-accent-strong" />
      {children}
    </span>
  )
}
