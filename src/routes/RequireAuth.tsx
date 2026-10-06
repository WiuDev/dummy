import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth'
import { paths } from '@/lib/paths'
import { loginRedirectState } from '@/lib/redirect'

// Layout route das páginas protegidas. Sem sessão (inclusive quando ela vence
// aqui dentro), leva ao login com o caminho atual no state, para voltar depois,
// e com replace, para o Voltar não cair de novo no redirecionamento (D58).
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate to={paths.login} replace state={loginRedirectState(location)} />
    )
  }

  return <Outlet />
}
