import { Button, Group, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { useLocation } from 'react-router'
import { AppNavLink } from '@/components/AppNavLink'
import { paths } from '@/lib/paths'
import { loginRedirectState } from '@/lib/redirect'
import { useAuth } from '../hooks/useAuth'
import { useSignOut } from '../hooks/useSignOut'

export interface AccountNavProps {
  // No menu mobile, fecha o Drawer ao navegar ou sair.
  readonly onNavigate?: () => void
}

// Itens da conta na navegação. Visitantes veem Entrar, que volta depois para a
// página atual; quem entrou vê Admin, o primeiro nome e Sair.
export function AccountNav({ onNavigate }: AccountNavProps) {
  const { user } = useAuth()
  const location = useLocation()
  const signOut = useSignOut()

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
      <Button
        variant="subtle"
        size="compact-sm"
        onClick={() => {
          onNavigate?.()
          signOut()
        }}
      >
        Sair
      </Button>
    </>
  )
}
