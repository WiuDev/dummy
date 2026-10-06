import { use } from 'react'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'

// Acesso à sessão. Fora do AuthProvider, lança um erro em vez de tratar todo
// mundo como visitante.
export function useAuth(): AuthContextValue {
  const auth = use(AuthContext)
  if (auth === null) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  }
  return auth
}
