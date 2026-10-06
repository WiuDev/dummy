import { notifications } from '@mantine/notifications'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import { clearAdminOverlay } from '@/lib/admin-overlay'
import {
  AUTH_SESSION_KEY,
  clearSession,
  createSession,
  inspectSession,
  isSessionExpired,
  type SessionLookup,
  writeSession,
} from '@/lib/auth-session'
import { onStorageKeyChange } from '@/lib/storage'
import type { RequestOptions } from '@/services/api'
import {
  type LoginCredentials,
  login as requestLogin,
} from '@/services/auth.service'
import { unauthorizedEvents } from '@/services/http-events'
import { AuthContext, type AuthContextValue } from './AuthContext'

export interface AuthProviderProps {
  readonly children: ReactNode
}

// Maior atraso que o setTimeout aceita (cerca de 24,8 dias). Acima disso, ele
// dispararia na hora.
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1

const SESSION_ENDED_NOTIFICATION_ID = 'session-ended'

// Sessão de autenticação para toda a aplicação (D57). A hidratação é síncrona,
// no inicializador: a sessão salva já vale no primeiro render, sem piscar
// "deslogado" nem redirecionar à toa ao recarregar. Uma sessão salva vencida é
// apagada pelo inspectSession e avisada.
export function AuthProvider({ children }: AuthProviderProps) {
  const [lookup, setLookup] = useState<SessionLookup>(inspectSession)
  const session = lookup.status === 'active' ? lookup.session : null

  // Sem sessão (Sair, vencimento, 401 ou logout em outra aba), as alterações
  // simuladas do admin deixam de valer (A4), mesmo com o admin desmontado.
  useEffect(() => {
    if (session === null) {
      clearAdminOverlay()
    }
  }, [session])

  // A sessão deixou de valer (venceu ou a API a recusou): avisa. O id fixo
  // evita avisos repetidos quando mais de uma camada percebe o fim.
  useEffect(() => {
    if (lookup.status === 'expired') {
      notifications.show({
        id: SESSION_ENDED_NOTIFICATION_ID,
        color: 'yellow',
        title: 'Sessão encerrada',
        message: 'Sua sessão expirou. Entre novamente para continuar.',
      })
    }
  }, [lookup])

  // Camada 1: timer até o vencimento. O atraso é limitado ao máximo do
  // setTimeout; por isso, quando o timer dispara, a sessão é conferida de novo
  // e, se ainda valer, o timer é reagendado. Vencida, o storage decide: outra
  // aba pode ter entrado de novo.
  useEffect(() => {
    if (session === null) {
      return undefined
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      const delay = Math.min(
        Math.max(session.expiresAt - Date.now(), 0),
        MAX_TIMER_DELAY_MS,
      )
      timer = setTimeout(() => {
        if (isSessionExpired(session)) {
          setLookup(inspectSession())
        } else {
          schedule()
        }
      }, delay)
    }
    schedule()
    return () => {
      clearTimeout(timer)
    }
  }, [session])

  // Camada 2: o navegador estrangula os timers de abas em segundo plano; ao
  // voltar à aba, a sessão é conferida.
  useEffect(() => {
    if (session === null) {
      return undefined
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSessionExpired(session)) {
        setLookup(inspectSession())
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session])

  // Camada 3 (D32): o interceptor avisa quando a sessão venceu antes do envio
  // ou quando a API respondeu 401. Sem sessão, não há o que encerrar.
  const endRejectedSession = useEffectEvent(() => {
    if (session !== null) {
      clearSession()
      setLookup({ status: 'expired' })
    }
  })

  useEffect(
    () =>
      unauthorizedEvents.subscribe(() => {
        endRejectedSession()
      }),
    [],
  )

  // Outra aba entrou ou saiu: relê o storage. O cleanup tira o listener.
  useEffect(
    () =>
      onStorageKeyChange(AUTH_SESSION_KEY, () => {
        setLookup(inspectSession())
      }),
    [],
  )

  const login = useCallback(
    async (credentials: LoginCredentials, options?: RequestOptions) => {
      const created = createSession(await requestLogin(credentials, options))
      writeSession(created)
      setLookup({ status: 'active', session: created })
    },
    [],
  )

  // O Sair encerra sem aviso.
  const logout = useCallback(() => {
    clearSession()
    setLookup({ status: 'absent' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
