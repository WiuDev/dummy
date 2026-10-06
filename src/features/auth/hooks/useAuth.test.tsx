import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { readSession } from '@/lib/auth-session'
import loginFixture from '@/test/fixtures/login.json'
import { AuthProvider } from '../context/AuthProvider'
import { useAuth } from './useAuth'

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

describe('useAuth', () => {
  it('fora do AuthProvider, lança um erro', () => {
    // O React registra no console o erro lançado durante a renderização.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de <AuthProvider>.',
    )
  })

  it('entra pela API, salva a sessão e sai', async () => {
    const { result } = renderAuth()
    expect(result.current.isAuthenticated).toBe(false)

    await act(async () => {
      await result.current.login({
        username: 'emilys',
        password: 'emilyspass',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toMatchObject({
      id: 1,
      firstName: 'Emily',
    })
    expect(readSession()?.accessToken).toBe(loginFixture.accessToken)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(readSession()).toBeNull()
  })

  it('com credenciais erradas, rejeita e continua sem sessão', async () => {
    const { result } = renderAuth()

    await act(async () => {
      await expect(
        result.current.login({ username: 'emilys', password: 'errada' }),
      ).rejects.toMatchObject({ kind: 'bad_request', status: 400 })
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(readSession()).toBeNull()
  })

  it('mantém as ações estáveis entre os renders', async () => {
    const { result } = renderAuth()
    const { login, logout } = result.current

    await act(async () => {
      await result.current.login({
        username: 'emilys',
        password: 'emilyspass',
      })
    })

    expect(result.current.login).toBe(login)
    expect(result.current.logout).toBe(logout)
  })
})
