import { describe, expect, it } from 'vitest'
import loginFixture from '@/test/fixtures/login.json'
import meFixture from '@/test/fixtures/me.json'
import {
  currentUserSchema,
  jwtPayloadSchema,
  loginResponseSchema,
  storedSessionSchema,
} from './auth'

const session = {
  version: 1,
  accessToken: loginFixture.accessToken,
  expiresAt: 4102444800000,
  user: {
    id: 1,
    username: 'emilys',
    email: 'emily.johnson@x.dummyjson.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    image: 'https://dummyjson.com/icon/emilys/128',
  },
}

describe('contrato de autenticação', () => {
  it('aceita a resposta de POST /auth/login e descarta gender', () => {
    const result = loginResponseSchema.safeParse(loginFixture)

    expect(result.success).toBe(true)
    expect(result.data?.accessToken).toBe(loginFixture.accessToken)
    expect(result.data).not.toHaveProperty('gender')
  })

  it('rejeita login sem token no formato JWT', () => {
    expect(
      loginResponseSchema.safeParse({ ...loginFixture, accessToken: 'abc' })
        .success,
    ).toBe(false)
    expect(
      loginResponseSchema.safeParse({ ...loginFixture, token: 'x' }).success,
    ).toBe(true)

    const legacy: Record<string, unknown> = { ...loginFixture }
    delete legacy['accessToken']
    expect(loginResponseSchema.safeParse(legacy).success).toBe(false)
  })

  it('aceita GET /auth/me e mantém só os campos necessários', () => {
    const result = currentUserSchema.safeParse(meFixture)

    expect(result.success).toBe(true)
    expect(Object.keys(result.data ?? {}).sort()).toEqual(
      [
        'email',
        'firstName',
        'id',
        'image',
        'lastName',
        'role',
        'username',
      ].sort(),
    )
  })

  it('valida o payload do JWT', () => {
    expect(
      jwtPayloadSchema.safeParse({
        id: 1,
        username: 'emilys',
        iat: 1,
        exp: 2,
      }).success,
    ).toBe(true)
    expect(
      jwtPayloadSchema.safeParse({ id: 1, username: 'emilys', iat: 1 }).success,
    ).toBe(false)
  })

  it('aceita a sessão salva só na versão 1 e com token JWT', () => {
    expect(storedSessionSchema.safeParse(session).success).toBe(true)
    expect(
      storedSessionSchema.safeParse({ ...session, version: 2 }).success,
    ).toBe(false)
    expect(
      storedSessionSchema.safeParse({ ...session, accessToken: 'abc.def' })
        .success,
    ).toBe(false)
  })
})
