import { Button, Group, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { startTransition } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AppNavLink } from '@/components/AppNavLink'
import { paths } from '@/lib/paths'
import { loginRedirectState } from '@/lib/redirect'
import { useAuth } from '../hooks/useAuth'

export interface AccountNavProps {
  // No menu mobile, fecha o Drawer ao navegar ou sair.
  readonly onNavigate?: () => void
}

function isProtectedPath(pathname: string): boolean {
  return pathname === paths.admin || pathname.startsWith(`${paths.admin}/`)
}

// Itens da conta na navegação. Visitantes veem Entrar, que volta depois para a
// página atual; quem entrou vê Admin, o primeiro nome e Sair.
export function AccountNav({ onNavigate }: AccountNavProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (user === null) {
    return (
      <AppNavLink
        to={paths.login}
        state={loginRedirectState(location)}
        onClick={onNavigate}
      >
        Entrar
      </AppNavLink>
    )
  }

  const handleLogout = () => {
    onNavigate?.()
    // Numa página protegida, vai antes para o catálogo: depois de um Sair, o
    // RequireAuth não deve levar ao login (D58). O React Router aplica a
    // navegação numa transição; o logout entra na mesma, para os dois chegarem
    // juntos ao mesmo render.
    startTransition(() => {
      if (isProtectedPath(location.pathname)) {
        void navigate(paths.products, { replace: true })
      }
      logout()
    })
  }

  return (
    <>
      <AppNavLink to={paths.admin} onClick={onNavigate}>
        Admin
      </AppNavLink>
      <Group gap={4} wrap="nowrap" px="xs">
        <IconUser size={16} aria-hidden />
        <Text size="sm" fw={600}>
          {user.firstName}
        </Text>
      </Group>
      <Button variant="subtle" size="compact-sm" onClick={handleLogout}>
        Sair
      </Button>
    </>
  )
}
