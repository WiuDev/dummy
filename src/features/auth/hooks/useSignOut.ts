import { startTransition, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isAdminPath, paths } from '@/lib/paths'
import { useAuth } from './useAuth'

// O Sair do cabeçalho público e da área administrativa. Numa página protegida,
// vai antes para o catálogo: depois de um Sair, o RequireAuth não deve levar ao
// login (D58). O React Router aplica a navegação numa transição; o logout entra
// na mesma, para os dois chegarem juntos ao mesmo render.
export function useSignOut(): () => void {
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return useCallback(() => {
    startTransition(() => {
      if (isAdminPath(pathname)) {
        void navigate(paths.products, { replace: true })
      }
      logout()
    })
  }, [logout, navigate, pathname])
}
