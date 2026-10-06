import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { type InitialEntry, MemoryRouter } from 'react-router'
import { theme } from '@/app/theme'
import { AuthProvider } from '@/features/auth'
import { CartProvider } from '@/features/cart'
import { writeSession } from '@/lib/auth-session'
import { writeCartItems } from '@/lib/cart-storage'
import type { AuthSession } from '@/schemas/auth'
import type { CartItem } from '@/schemas/cart'

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  'wrapper'
> {
  readonly route?: string
  // Histórico inicial, para simular a navegação anterior; a última entrada é a
  // rota atual. Uma entrada pode ser um objeto com state (ex.: o from do
  // login). Quando informado, substitui o route.
  readonly initialEntries?: readonly InitialEntry[]
  // Itens já no carrinho: gravados no storage do jsdom (em memória e limpo
  // depois de cada teste) antes de montar o CartProvider.
  readonly cartItems?: readonly CartItem[]
  // Sessão já ativa (ex.: activeSession() de src/test/session.ts), gravada no
  // storage do jsdom antes de montar o AuthProvider.
  readonly session?: AuthSession
}

// Envolve o componente nos providers da aplicação: Mantine em modo de teste
// (sem transições nem portais), notificações, roteador em memória, sessão e
// carrinho.
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    initialEntries,
    cartItems,
    session,
    ...options
  }: RenderWithProvidersOptions = {},
): RenderResult {
  const entries = initialEntries ?? [route]
  if (cartItems !== undefined) {
    writeCartItems(cartItems)
  }
  if (session !== undefined) {
    writeSession(session)
  }

  function Providers({ children }: { readonly children: ReactNode }) {
    return (
      <MantineProvider theme={theme} env="test">
        <Notifications />
        <MemoryRouter
          initialEntries={[...entries]}
          initialIndex={entries.length - 1}
        >
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </MemoryRouter>
      </MantineProvider>
    )
  }

  return render(ui, { wrapper: Providers, ...options })
}
