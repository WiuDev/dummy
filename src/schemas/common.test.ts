import { describe, expect, it } from 'vitest'
import accessTokenRequiredFixture from '@/test/fixtures/error-access-token-required.json'
import invalidCredentialsFixture from '@/test/fixtures/error-invalid-credentials.json'
import invalidTokenFixture from '@/test/fixtures/error-invalid-token.json'
import notFoundFixture from '@/test/fixtures/error-not-found.json'
import { apiErrorBodySchema } from './common'

describe('contrato dos erros', () => {
  it.each([
    ['404', notFoundFixture],
    ['400 de login', invalidCredentialsFixture],
    ['401 sem token', accessTokenRequiredFixture],
    ['401 com token inválido', invalidTokenFixture],
  ])('aceita o corpo do erro %s', (_name, fixture) => {
    expect(apiErrorBodySchema.safeParse(fixture).success).toBe(true)
  })

  it('rejeita corpo sem mensagem', () => {
    expect(apiErrorBodySchema.safeParse({}).success).toBe(false)
    expect(apiErrorBodySchema.safeParse({ message: '' }).success).toBe(false)
  })
})
