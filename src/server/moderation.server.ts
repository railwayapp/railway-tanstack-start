// A public board needs a few guard rails. Railway runs your app as a
// persistent server, so a plain in-memory Map is a perfectly good rate
// limiter for a single replica. Scaling out? Swap this for Redis.

const WINDOW_MS = 60_000
const MAX_POSTS_PER_WINDOW = 3
const hits = new Map<string, Array<number>>()

export function checkRateLimit(key: string) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_POSTS_PER_WINDOW) {
    const retryIn = Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000)
    return { ok: false as const, retryIn }
  }
  recent.push(now)
  hits.set(key, recent)
  return { ok: true as const }
}

// Prune stale keys so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
  }
}, WINDOW_MS).unref()

const BLOCKED = [/https?:\/\//i, /www\./i, /\.(com|net|org|io|xyz|ru)\b/i]

export function containsBlockedContent(...values: Array<string>) {
  return values.some((v) => BLOCKED.some((re) => re.test(v)))
}
