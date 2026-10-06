import { describe, expect, it } from 'vitest'
import { AppError } from '@/lib/errors'
import { toAppError } from './http-error'

// As falhas do axios são exercitadas com requisições reais (MSW) em api.test.ts.
describe('toAppError', () => {
  it('devolve o próprio AppError', () => {
    const error = new AppError('not_found')

    expect(toAppError(error)).toBe(error)
  })

  it('converte falhas que não vêm do axios em unknown', () => {
    const original = new TypeError('falhou')
    const error = toAppError(original)

    expect(error.kind).toBe('unknown')
    expect(error.cause).toBe(original)
  })

  it('converte valores que nem são erros', () => {
    expect(toAppError('texto').kind).toBe('unknown')
    expect(toAppError(undefined).kind).toBe('unknown')
  })
})
