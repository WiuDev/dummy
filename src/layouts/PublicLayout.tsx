import {
  Anchor,
  AppShell,
  Burger,
  Container,
  Drawer,
  Group,
  Stack,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconShoppingBag } from '@tabler/icons-react'
import { Link, Outlet } from 'react-router'
import { AppNavLink } from '@/components/AppNavLink'
import { paths } from '@/lib/paths'
import classes from './PublicLayout.module.css'

// Só rotas que já existem: Carrinho e Entrar chegam nas Fases 4 e 5.
const NAV_ITEMS = [{ to: paths.products, label: 'Produtos' }] as const

const MAIN_ID = 'conteudo'

// Layout da área pública: cabeçalho persistente com a navegação (em linha no
// desktop e num Drawer no mobile) e a página atual no <Outlet />.
export function PublicLayout() {
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] =
    useDisclosure(false)

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <a href={`#${MAIN_ID}`} className={classes.skipLink}>
        Pular para o conteúdo
      </a>

      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Anchor
              component={Link}
              to={paths.products}
              underline="never"
              className={classes.brand}
            >
              <IconShoppingBag aria-hidden size={26} stroke={1.75} />
              Loja Dummy
            </Anchor>

            <Group
              component="nav"
              aria-label="Navegação principal"
              gap="xs"
              visibleFrom="sm"
            >
              {NAV_ITEMS.map((item) => (
                <AppNavLink key={item.to} to={item.to}>
                  {item.label}
                </AppNavLink>
              ))}
            </Group>

            <Burger
              opened={menuOpened}
              onClick={toggleMenu}
              hiddenFrom="sm"
              size="sm"
              aria-label="Abrir menu"
              aria-expanded={menuOpened}
            />
          </Group>
        </Container>
      </AppShell.Header>

      <Drawer
        opened={menuOpened}
        onClose={closeMenu}
        title="Menu"
        position="right"
        size="xs"
        closeButtonProps={{ 'aria-label': 'Fechar menu' }}
      >
        <Stack component="nav" aria-label="Navegação principal" gap="xs">
          {NAV_ITEMS.map((item) => (
            <AppNavLink key={item.to} to={item.to} onClick={closeMenu}>
              {item.label}
            </AppNavLink>
          ))}
        </Stack>
      </Drawer>

      <AppShell.Main id={MAIN_ID} tabIndex={-1} className={classes.main}>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
