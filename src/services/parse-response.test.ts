import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from '@/lib/errors'
import { parseResponse } from './parse-response'

const schema = z.object({ id: z.number() })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseResponse', () => {
  it('devolve os dados validados, sem campos desconhecidos', () => {
    expect(parseResponse(schema, { id: 1, extra: true }, 'GET /x')).toEqual({
      id: 1,
    })
  })

  it('lança AppError invalid_response quando o contrato não bate', () => {
    const consoleError = vi.spyOn(console, 'error')
    let caught: unknown

    try {
      parseResponse(schema, { id: '1' }, 'GET /x')
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(AppError)
    expect(caught).toMatchObject({
      kind: 'invalid_response',
      message: 'Resposta inesperada do servidor.',
    })
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('em desenvolvimento, mostra no console o que não bateu', () => {
    vi.stubEnv('MODE', 'development')
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    expect(() => parseResponse(schema, { id: '1' }, 'GET /x')).toThrow(AppError)

    expect(consoleError).toHaveBeenCalledOnce()
    expect(consoleError.mock.calls[0]?.[0]).toMatch(
      /^Resposta inválida de GET \/x:\n.*\n\s*→ at id$/,
    )
  })
})
