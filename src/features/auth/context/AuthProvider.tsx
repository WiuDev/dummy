import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AUTH_SESSION_KEY,
  clearSession,
  createSession,
  inspectSession,
  type SessionLookup,
  writeSession,
} from '@/lib/auth-session'
import { onStorageKeyChange } from '@/lib/storage'
import type { RequestOptions } from '@/services/api'
import {
  type LoginCredentials,
  login as requestLogin,
} from '@/services/auth.service'
import { AuthContext, type AuthContextValue } from './AuthContext'

export interface AuthProviderProps {
  readonly children: ReactNode
}

// Sessão de autenticação para toda a aplicação (D57). A hidratação é síncrona,
// no inicializador: a sessão salva já vale no primeiro render, sem piscar
// "deslogado" nem redirecionar à toa ao recarregar. Uma sessão salva vencida é
// apagada pelo inspectSession.
export function AuthProvider({ children }: AuthProviderProps) {
  const [lookup, setLookup] = useState<SessionLookup>(inspectSession)
  const session = lookup.status === 'active' ? lookup.session : null

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
