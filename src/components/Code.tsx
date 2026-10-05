// A tiny TS highlighter: comments, strings and keywords. Enough for short
// snippets without shipping a syntax-highlighting library.
const TOKEN =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")|\b(import|from|export|const|async|await|return|function|throw|new|type|if)\b|\b(createServerFn|createFileRoute|createMiddleware|createStart|createCsrfMiddleware|createServerOnlyFn|queryOptions|useSuspenseQuery|notFound|Await|Suspense)\b/gm

function highlight(code: string) {
  const out: Array<React.ReactNode> = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const cls = m[1]
      ? 'text-board-dim italic'
      : m[2]
        ? 'text-[#95d0b4]'
        : m[3]
          ? 'text-board-time'
          : 'text-[#8caef2]'
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  out.push(code.slice(last))
  return out
}

export function Code({ code, file }: { code: string; file?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-board ring-1 ring-white/10">
      {file && (
        <div className="border-b border-white/10 px-4 py-2.5 font-mono text-[12px] text-board-dim">
          {file}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-[1.7] text-board-ink [font-variant-ligatures:none]">
        <code>{highlight(code.trim())}</code>
      </pre>
    </div>
  )
}
