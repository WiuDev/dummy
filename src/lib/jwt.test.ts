import { describe, expect, it } from 'vitest'
import { createTestJwt } from '@/test/jwt'
import { decodeJwtPayload, getJwtExpiration } from './jwt'

describe('decodeJwtPayload', () => {
  it('lê o payload, inclusive com caracteres acentuados', () => {
    const token = createTestJwt({
      id: 7,
      username: 'joão.ângela',
      iat: 100,
      exp: 200,
    })

    expect(decodeJwtPayload(token)).toEqual({
      id: 7,
      username: 'joão.ângela',
      iat: 100,
      exp: 200,
    })
  })

  it('devolve null quando o token não tem três partes', () => {
    expect(decodeJwtPayload('abc')).toBeNull()
    expect(decodeJwtPayload('a.b')).toBeNull()
    expect(decodeJwtPayload('a.b.c.d')).toBeNull()
  })

  it('devolve null quando o payload não é base64url de um JSON', () => {
    expect(decodeJwtPayload('aaa.!!!.ccc')).toBeNull()
    expect(decodeJwtPayload(`aaa.${btoa('não é json')}.ccc`)).toBeNull()
  })

  it('devolve null quando o payload não tem os campos esperados', () => {
    const token = createTestJwt({ username: 'emilys', iat: 1 })

    expect(decodeJwtPayload(token)).toBeNull()
  })
})

describe('getJwtExpiration', () => {
  it('converte o exp (segundos) para milissegundos', () => {
    const token = createTestJwt({ id: 1, username: 'emilys', iat: 1, exp: 60 })

    expect(getJwtExpiration(token)).toBe(60_000)
  })

  it('devolve null para token inválido', () => {
    expect(getJwtExpiration('inválido')).toBeNull()
  })
})
