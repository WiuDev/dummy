import { createSession, writeSession } from '@/lib/auth-session'
import type { AuthSession } from '@/schemas/auth'
import loginFixture from '@/test/fixtures/login.json'
import { createTestJwt } from './jwt'

// Grava no localStorage uma sessão válida (o token da fixture vence em 2100).
export function seedActiveSession(): AuthSession {
  const session = createSession(loginFixture)
  writeSession(session)
  return session
}

// Grava uma sessão cujo token venceu há um minuto.
export function seedExpiredSession(): AuthSession {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const session = createSession({
    ...loginFixture,
    accessToken: createTestJwt({
      id: 1,
      username: 'emilys',
      iat: nowInSeconds - 3600,
      exp: nowInSeconds - 60,
    }),
  })
  writeSession(session)
  return session
}
