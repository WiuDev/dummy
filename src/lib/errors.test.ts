import { describe, expect, it } from 'vitest'
import {
  APP_ERROR_MESSAGES,
  AppError,
  type AppErrorKind,
  asAppError,
  isAppError,
} from './errors'

describe('AppError', () => {
  it('usa a mensagem padrão do tipo quando nenhuma é informada', () => {
    const error = new AppError('network')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AppError')
    expect(error.kind).toBe('network')
    expect(error.message).toBe(
      'Não foi possível conectar. Verifique sua internet.',
    )
    expect(error.status).toBeUndefined()
    expect(error.serverMessage).toBeUndefined()
  })

  it('guarda mensagem, status, mensagem do servidor e causa', () => {
    const cause = new Error('original')
    const error = new AppError('bad_request', 'Mensagem própria.', {
      status: 400,
      serverMessage: 'Invalid credentials',
      cause,
    })

    expect(error.message).toBe('Mensagem própria.')
    expect(error.status).toBe(400)
    expect(error.serverMessage).toBe('Invalid credentials')
    expect(error.cause).toBe(cause)
  })

  it('tem mensagem em português para todos os tipos', () => {
    const kinds = Object.keys(APP_ERROR_MESSAGES) as AppErrorKind[]

    expect(kinds).toHaveLength(11)
    for (const kind of kinds) {
      expect(new AppError(kind).message).toBe(APP_ERROR_MESSAGES[kind])
      expect(APP_ERROR_MESSAGES[kind].length).toBeGreaterThan(0)
    }
  })
})

describe('isAppError', () => {
  it('reconhece só instâncias de AppError', () => {
    expect(isAppError(new AppError('server'))).toBe(true)
    expect(isAppError(new Error('x'))).toBe(false)
    expect(isAppError({ kind: 'server', message: 'x' })).toBe(false)
    expect(isAppError(undefined)).toBe(false)
  })
})

describe('asAppError', () => {
  it('devolve o próprio AppError', () => {
    const error = new AppError('timeout')

    expect(asAppError(error)).toBe(error)
  })

  it('envolve outras falhas como unknown, preservando a causa', () => {
    const original = new TypeError('falhou')
    const error = asAppError(original)

    expect(error.kind).toBe('unknown')
    expect(error.message).toBe('Ocorreu um erro inesperado.')
    expect(error.cause).toBe(original)
  })
})
