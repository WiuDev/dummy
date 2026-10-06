import { notifications } from '@mantine/notifications'
import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_SESSION_KEY,
  clearSession,
  readSession,
  writeSession,
} from '@/lib/auth-session'
import {
  ADMIN_OVERLAY_KEY,
  EMPTY_ADMIN_OVERLAY,
  writeAdminOverlay,
} from '@/lib/admin-overlay'
import { unauthorizedEvents } from '@/services/http-events'
import { lampFields } from '@/test/admin'
import { renderWithProviders } from '@/test/render'
import {
  activeSession,
  seedActiveSession,
  seedExpiredSession,
  sessionExpiringIn,
} from '@/test/session'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthProvider'

// Maior atraso do setTimeout, o mesmo limite do AuthProvider.
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1
const SESSION_ENDED = 'Sua sessão expirou. Entre novamente para continuar.'

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

function SessionStatus() {
  const { user, logout } = useAuth()
  return user === null ? (
    <p>Visitante</p>
  ) : (
    <button type="button" onClick={logout}>
      Sair da sessão de {user.firstName}
    </button>
  )
}

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

// Simula outra aba: muda o storage e dispara o evento storage, que o navegador
// só entrega às outras abas.
function changeInAnotherTab(change: () => void) {
  act(() => {
    change()
    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_SESSION_KEY }))
  })
}

// Um overlay do admin com um produto criado, salvo no sessionStorage.
function seedAdminOverlay() {
  writeAdminOverlay({
    ...EMPTY_ADMIN_OVERLAY,
    created: [{ ...lampFields, id: 10_000 }],
    nextLocalId: 10_001,
  })
}

const adminOverlaySaved = () =>
  window.sessionStorage.getItem(ADMIN_OVERLAY_KEY) !== null

describe('overlay do admin (A4)', () => {
  it('fica enquanto a sessão vale', () => {
    seedActiveSession()
    seedAdminOverlay()

    renderAuth()

    expect(adminOverlaySaved()).toBe(true)
  })

  it('é apagado pelo Sair, mesmo sem o admin montado', () => {
    seedActiveSession()
    seedAdminOverlay()
    const { result } = renderAuth()

    act(() => {
      result.current.logout()
    })

    expect(adminOverlaySaved()).toBe(false)
  })

  it('é apagado quando a API recusa a sessão', () => {
    seedActiveSession()
    seedAdminOverlay()
    renderAuth()

    act(() => {
      unauthorizedEvents.emit({ reason: 'rejected', url: '/auth/products' })
    })

    expect(adminOverlaySaved()).toBe(false)
  })

  it('é apagado quando outra aba sai', () => {
    seedActiveSession()
    seedAdminOverlay()
    renderAuth()

    changeInAnotherTab(() => {
      clearSession()
    })

    expect(adminOverlaySaved()).toBe(false)
  })

  it('não sobrevive a uma sessão salva vencida', () => {
    seedExpiredSession()
    seedAdminOverlay()

    renderAuth()

    expect(adminOverlaySaved()).toBe(false)
  })
})

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

describe('fim da sessão', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('camada 1: o timer encerra a sessão no vencimento e avisa', () => {
    renderWithProviders(<SessionStatus />, {
      session: sessionExpiringIn(60_000),
    })
    expect(screen.getByText('Sair da sessão de Emily')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(59_999)
    })
    expect(screen.getByText('Sair da sessão de Emily')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.getByText(SESSION_ENDED)).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })

  it('camada 1: o timer limitado confere a sessão de novo e reagenda, sem encerrar antes da hora', () => {
    const fiveMinutes = 5 * 60_000
    renderWithProviders(<SessionStatus />, {
      session: sessionExpiringIn(MAX_TIMER_DELAY_MS + fiveMinutes),
    })

    // O primeiro disparo chega no limite do setTimeout, antes do vencimento.
    act(() => {
      vi.advanceTimersByTime(MAX_TIMER_DELAY_MS)
    })
    expect(screen.getByText('Sair da sessão de Emily')).toBeInTheDocument()
    expect(readSession()).not.toBeNull()
    expect(screen.queryByText(SESSION_ENDED)).toBeNull()

    // Reagendado, o timer encerra a sessão no vencimento de verdade.
    act(() => {
      vi.advanceTimersByTime(fiveMinutes)
    })
    expect(screen.getByText('Visitante')).toBeInTheDocument()
  })

  it('camada 2: ao voltar à aba, encerra a sessão que venceu em segundo plano', () => {
    renderWithProviders(<SessionStatus />, {
      session: sessionExpiringIn(60_000),
    })

    // O relógio anda sem o timer disparar, como numa aba em segundo plano.
    vi.setSystemTime(Date.now() + 120_000)
    expect(screen.getByText('Sair da sessão de Emily')).toBeInTheDocument()

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.getByText(SESSION_ENDED)).toBeInTheDocument()
  })

  it('camada 2: ao voltar à aba com a sessão ainda válida, nada muda', () => {
    renderWithProviders(<SessionStatus />, {
      session: sessionExpiringIn(60_000),
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(screen.getByText('Sair da sessão de Emily')).toBeInTheDocument()
    expect(readSession()).not.toBeNull()
  })

  it('camada 3: a sessão recusada pela API (401) é encerrada e avisada', () => {
    renderWithProviders(<SessionStatus />, { session: activeSession() })

    act(() => {
      unauthorizedEvents.emit({ reason: 'rejected', url: '/auth/carts/add' })
    })

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.getByText(SESSION_ENDED)).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })

  it('sem sessão, o aviso do interceptor não muda nada', () => {
    renderWithProviders(<SessionStatus />)

    act(() => {
      unauthorizedEvents.emit({ reason: 'expired', url: '/auth/me' })
    })

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.queryByText(SESSION_ENDED)).toBeNull()
  })

  it('avisa quando a sessão salva já tinha vencido ao abrir', () => {
    seedExpiredSession()

    renderWithProviders(<SessionStatus />)

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.getByText(SESSION_ENDED)).toBeInTheDocument()
  })

  it('o Sair encerra a sessão sem aviso', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    renderWithProviders(<SessionStatus />, { session: activeSession() })

    await user.click(
      screen.getByRole('button', { name: 'Sair da sessão de Emily' }),
    )

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.queryByText(SESSION_ENDED)).toBeNull()
  })

  it('ao desmontar, cancela o timer e as escutas', () => {
    const removeListener = vi.spyOn(document, 'removeEventListener')
    writeSession(sessionExpiringIn(60_000))
    const { unmount } = renderAuth()

    unmount()
    act(() => {
      vi.advanceTimersByTime(120_000)
      unauthorizedEvents.emit({ reason: 'rejected', url: '/auth/me' })
    })

    // Nem o timer nem o aviso do interceptor chegaram ao Provider desmontado:
    // a sessão continua salva, mesmo vencida.
    expect(window.localStorage.getItem(AUTH_SESSION_KEY)).not.toBeNull()
    expect(removeListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    )
  })
})
