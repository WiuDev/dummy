import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AUTH_SESSION_KEY,
  clearSession,
  readSession,
  writeSession,
} from '@/lib/auth-session'
import {
  activeSession,
  seedActiveSession,
  seedExpiredSession,
} from '@/test/session'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

// Simula outra aba: muda o storage e dispara o evento storage, que o navegador
// só entrega às outras abas.
function changeInAnotherTab(change: () => void) {
  act(() => {
    change()
    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_SESSION_KEY }))
  })
}

describe('AuthProvider', () => {
  it('começa com a sessão salva, já no primeiro render', () => {
    seedActiveSession()

    const { result } = renderAuth()

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.username).toBe('emilys')
  })

  it('sem sessão salva, começa como visitante', () => {
    const { result } = renderAuth()

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('apaga a sessão salva vencida e começa como visitante', () => {
    seedExpiredSession()

    const { result } = renderAuth()

    expect(result.current.isAuthenticated).toBe(false)
    expect(window.localStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
  })

  it('acompanha o login e o logout feitos em outra aba', () => {
    const { result } = renderAuth()

    changeInAnotherTab(() => {
      writeSession(activeSession())
    })
    expect(result.current.user?.firstName).toBe('Emily')

    changeInAnotherTab(() => {
      clearSession()
    })
    expect(result.current.user).toBeNull()
    expect(readSession()).toBeNull()
  })

  it('para de ouvir o evento storage ao desmontar', () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderAuth()
    const listener = addListener.mock.calls.find(
      ([type]) => type === 'storage',
    )?.[1]

    unmount()

    expect(listener).toBeDefined()
    expect(removeListener).toHaveBeenCalledWith('storage', listener)
  })
})
