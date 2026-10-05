import { createMiddleware } from '@tanstack/react-start'

// Request middleware runs for every request Start handles: SSR pages, server
// routes and server function calls from the browser. This one adds a
// Server-Timing header (visible in your browser's devtools Network tab) and
// tags the serving region. `dur` is time until the response starts; streamed
// content can keep arriving after that.
export const requestTimingMiddleware = createMiddleware().server(
  async ({ next, handlerType }) => {
    const start = performance.now()
    const result = await next()
    const dur = (performance.now() - start).toFixed(1)
    result.response.headers.append(
      'Server-Timing',
      `${handlerType === 'serverFn' ? 'fn' : 'app'};dur=${dur}`,
    )
    result.response.headers.set(
      'x-railway-region',
      process.env.RAILWAY_REPLICA_REGION ?? 'local',
    )
    return result
  },
)

// Function middleware wraps every server function call. It also has a
// .client() half for code that runs in the browser around the RPC.
export const serverFnLogMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next, serverFnMeta }) => {
  const start = performance.now()
  try {
    return await next()
  } finally {
    const ms = (performance.now() - start).toFixed(1)
    console.log(`[server fn] ${serverFnMeta.name} ${ms}ms`)
  }
})
