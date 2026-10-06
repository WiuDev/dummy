import { describe, expect, it } from 'vitest'
import type { LoginResponse } from '@/schemas/auth'
import loginFixture from '@/test/fixtures/login.json'
import { createTestJwt, secondsFromNow, TEST_NOW } from '@/test/jwt'
import {
  AUTH_SESSION_KEY,
  clearSession,
  createSession,
  inspectSession,
  isSessionExpired,
  readSession,
  writeSession,
} from './auth-session'

function loginResponse(accessToken: string): LoginResponse {
  return { ...loginFixture, accessToken }
}

const activeToken = createTestJwt({
  id: 1,
  username: 'emilys',
  iat: secondsFromNow(0),
  exp: secondsFromNow(3600),
})

describe('createSession', () => {
  it('usa o exp do JWT como expiração e guarda só os dados do usuário', () => {
    const session = createSession(loginResponse(activeToken), TEST_NOW)

    expect(session).toEqual({
      version: 1,
      accessToken: activeToken,
      expiresAt: TEST_NOW + 3_600_000,
      user: {
        id: 1,
        username: 'emilys',
        email: 'emily.johnson@x.dummyjson.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        image: 'https://dummyjson.com/icon/emilys/128',
      },
    })
  })

  it('assume 60 minutos quando o JWT não informa a expiração', () => {
    const tokenWithoutExp = createTestJwt({ id: 1, username: 'emilys' })

    expect(
      createSession(loginResponse(tokenWithoutExp), TEST_NOW).expiresAt,
    ).toBe(TEST_NOW + 60 * 60 * 1000)
  })
})

describe('sessão salva', () => {
  it('grava, lê e informa a sessão ativa', () => {
    const session = createSession(loginResponse(activeToken), TEST_NOW)

    writeSession(session)

    expect(inspectSession(TEST_NOW)).toEqual({ status: 'active', session })
    expect(readSession(TEST_NOW)).toEqual(session)
  })

  it('informa ausência quando não há sessão', () => {
    expect(inspectSession(TEST_NOW)).toEqual({ status: 'absent' })
    expect(readSession(TEST_NOW)).toBeNull()
  })

  it('informa e apaga a sessão expirada', () => {
    const session = createSession(loginResponse(activeToken), TEST_NOW)
    writeSession(session)

    const later = session.expiresAt

    expect(inspectSession(later)).toEqual({ status: 'expired' })
    expect(window.localStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
    expect(inspectSession(later)).toEqual({ status: 'absent' })
  })

  it('trata dados adulterados como ausência e os apaga', () => {
    window.localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ version: 1, accessToken: 'não-é-jwt', expiresAt: 1 }),
    )

    expect(inspectSession(TEST_NOW)).toEqual({ status: 'absent' })
    expect(window.localStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
  })

  it('apaga a sessão no logout', () => {
    writeSession(createSession(loginResponse(activeToken), TEST_NOW))

    clearSession()

    expect(readSession(TEST_NOW)).toBeNull()
  })
})

describe('isSessionExpired', () => {
  it('considera expirada a partir do instante de expiração', () => {
    const session = createSession(loginResponse(activeToken), TEST_NOW)

    expect(isSessionExpired(session, session.expiresAt - 1)).toBe(false)
    expect(isSessionExpired(session, session.expiresAt)).toBe(true)
  })
})
