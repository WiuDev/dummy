import {
  Alert,
  Anchor,
  AppShell,
  Burger,
  Button,
  Center,
  Group,
  Loader,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconInfoCircle, IconShoppingBag } from '@tabler/icons-react'
import { Suspense } from 'react'
import { Link, Outlet } from 'react-router'
import { AppNavLink } from '@/components/AppNavLink'
import { AdminProductsProvider } from '@/features/admin-products'
import { useAuth, useSignOut } from '@/features/auth'
import { paths } from '@/lib/paths'
import classes from './AdminLayout.module.css'

const MAIN_ID = 'conteudo'

function PageLoader() {
  return (
    <Center py="xl">
      <Loader aria-label="Carregando a página" />
    </Center>
  )
}

// Layout da área administrativa (carregado sob demanda, D53): AppShell com o
// usuário, o Sair e uma navbar que recolhe no desktop e abre por um Burger no
// celular. O aviso de simulação fica fixo (D5), e o overlay só existe aqui.
export function AdminLayout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure(false)
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
  const { user } = useAuth()
  const signOut = useSignOut()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 220,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <a href={`#${MAIN_ID}`} className={classes.skipLink}>
        Pular para o conteúdo
      </a>

      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Menu do admin"
              aria-expanded={mobileOpened}
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
              aria-label="Barra lateral do admin"
              aria-expanded={desktopOpened}
            />
            <Anchor
              component={Link}
              to={paths.adminProducts}
              underline="never"
              className={classes.brand}
            >
              <IconShoppingBag aria-hidden size={24} stroke={1.75} />
              Loja Dummy · Admin
            </Anchor>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Anchor component={Link} to={paths.products} size="sm">
              Ver a loja
            </Anchor>
            {user === null ? null : (
              <Text size="sm" fw={600}>
                {user.firstName}
              </Text>
            )}
            <Button variant="subtle" size="compact-sm" onClick={signOut}>
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" aria-label="Navegação do admin">
        <AppNavLink to={paths.adminProducts} onClick={closeMobile}>
          Produtos
        </AppNavLink>
      </AppShell.Navbar>

      <AppShell.Main id={MAIN_ID} tabIndex={-1} className={classes.main}>
        <Alert
          variant="light"
          color="yellow"
          title="Alterações simuladas"
          icon={<IconInfoCircle aria-hidden />}
          mb="lg"
        >
          A DummyJSON simula as gravações: cadastros, edições e exclusões valem
          só nesta aba e somem quando a sessão termina.
        </Alert>
        <AdminProductsProvider>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </AdminProductsProvider>
      </AppShell.Main>
    </AppShell>
  )
}
