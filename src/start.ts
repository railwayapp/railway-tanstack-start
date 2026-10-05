import { createCsrfMiddleware, createStart } from '@tanstack/react-start'
import {
  requestTimingMiddleware,
  serverFnLogMiddleware,
} from './server/middleware'

// Global Start configuration. Exporting a startInstance replaces Start's
// default CSRF middleware for server functions, so it's added explicitly here.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, requestTimingMiddleware],
  functionMiddleware: [serverFnLogMiddleware],
}))
