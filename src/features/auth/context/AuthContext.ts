import { createContext } from 'react'
import type { AuthUser } from '@/schemas/auth'
import type { RequestOptions } from '@/services/api'
import type { LoginCredentials } from '@/services/auth.service'

export interface AuthContextValue {
  // Usuário da sessão ativa; null para visitantes. O token não sai daqui: o
  // interceptor o lê do storage.
  readonly user: AuthUser | null
  readonly isAuthenticated: boolean
  // Entra pela API e salva a sessão. Na falha, rejeita com o AppError, que a
  // página de login trata.
  readonly login: (
    credentials: LoginCredentials,
    options?: RequestOptions,
  ) => Promise<void>
  // Encerra a sessão pelo botão Sair. O carrinho continua (D57).
  readonly logout: () => void
}

// Sem valor padrão: fora do AuthProvider, o useAuth lança um erro.
export const AuthContext = createContext<AuthContextValue | null>(null)
