import { createSession, writeSession } from '@/lib/auth-session'
import type { AuthSession } from '@/schemas/auth'
import loginFixture from '@/test/fixtures/login.json'
import { createTestJwt } from './jwt'

// Sessão válida, sem gravar: o token da fixture vence em 2100.
export function activeSession(): AuthSession {
  return createSession(loginFixture)
}

// Sessão que vence daqui a ms milissegundos (testes de expiração com fake
// timers).
export function sessionExpiringIn(ms: number): AuthSession {
  return { ...activeSession(), expiresAt: Date.now() + ms }
}

// Grava no localStorage uma sessão válida.
export function seedActiveSession(): AuthSession {
  const session = activeSession()
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
