import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="eyebrow">Signal failure</p>
      <h1 className="headline mt-3 text-[36px] leading-tight">
        Something went wrong on the line.
      </h1>
      <div className="mt-6 w-full overflow-auto rounded-xl border border-line bg-surface p-4 text-left text-[13px]">
        <ErrorComponent error={error} />
      </div>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => router.invalidate()}
          className="btn-primary"
        >
          Try again
        </button>
        {isRoot ? (
          <Link to="/" className="btn-secondary">
            Home
          </Link>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
