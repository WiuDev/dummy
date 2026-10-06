import {
  type AuthSession,
  type LoginResponse,
  storedSessionSchema,
} from '@/schemas/auth'
import { getJwtExpiration } from './jwt'
import { createStorageItem } from './storage'

export const AUTH_SESSION_KEY = 'dummy:auth:v1'

// Duração padrão do token na DummyJSON, usada se o JWT não informar o exp.
const DEFAULT_SESSION_MS = 60 * 60 * 1000

const sessionItem = createStorageItem({
  key: AUTH_SESSION_KEY,
  schema: storedSessionSchema,
})

export type SessionLookup =
  | { readonly status: 'absent' }
  | { readonly status: 'expired' }
  | { readonly status: 'active'; readonly session: AuthSession }

export function createSession(
  response: LoginResponse,
  now: number = Date.now(),
): AuthSession {
  const { accessToken, id, username, email, firstName, lastName, image } =
    response

  return {
    version: 1,
    accessToken,
    expiresAt: getJwtExpiration(accessToken) ?? now + DEFAULT_SESSION_MS,
    user: { id, username, email, firstName, lastName, image },
  }
}

export function isSessionExpired(
  session: AuthSession,
  now: number = Date.now(),
): boolean {
  return session.expiresAt <= now
}

// Situação da sessão salva. Dados inválidos contam como ausência e são
// apagados; uma sessão expirada também é apagada, mas é informada como tal.
export function inspectSession(now: number = Date.now()): SessionLookup {
  const session = sessionItem.read()
  if (session === null) {
    return { status: 'absent' }
  }
  if (isSessionExpired(session, now)) {
    sessionItem.remove()
    return { status: 'expired' }
  }
  return { status: 'active', session }
}

export function readSession(now: number = Date.now()): AuthSession | null {
  const lookup = inspectSession(now)
  return lookup.status === 'active' ? lookup.session : null
}

export function writeSession(session: AuthSession): void {
  sessionItem.write(session)
}

export function clearSession(): void {
  sessionItem.remove()
}
