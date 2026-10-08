import { useSession } from '@tanstack/react-start/server'

type VisitorSession = { visitorId?: string }

const DEV_SECRET = 'dev-only-secret-change-me-0123456789abcdef'

// An anonymous, encrypted cookie session. No login: it just lets visitors
// delete the departures they posted.
function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  // The dev default is public, so a production cookie sealed with it could be
  // forged. Fail loudly instead.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set to at least 32 characters.')
  }
  return DEV_SECRET
}

export function useVisitorSession() {
  const password = sessionSecret()
  return useSession<VisitorSession>({
    name: 'departures-session',
    password,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    },
  })
}

export async function getVisitorId() {
  const session = await useVisitorSession()
  return session.data.visitorId
}

export async function ensureVisitorId() {
  const session = await useVisitorSession()
  if (session.data.visitorId) return session.data.visitorId
  const visitorId = crypto.randomUUID()
  await session.update({ visitorId })
  return visitorId
}
