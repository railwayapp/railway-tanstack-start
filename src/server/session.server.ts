import { useSession } from '@tanstack/react-start/server'

type VisitorSession = { visitorId?: string }

const DEV_SECRET = 'dev-only-secret-change-me-0123456789abcdef'

// An anonymous, encrypted cookie session. No login: it just lets visitors
// delete the departures they posted.
export function useVisitorSession() {
  const password = process.env.SESSION_SECRET ?? DEV_SECRET
  if (password === DEV_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('SESSION_SECRET is not set — using an insecure default.')
  }
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
