import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { theme } from '@/app/theme'
import { CartProvider } from '@/features/cart'
import { writeCartItems } from '@/lib/cart-storage'
import type { CartItem } from '@/schemas/cart'

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  'wrapper'
> {
  readonly route?: string
  // Histórico inicial, para simular a navegação anterior; a última entrada é a
  // rota atual. Quando informado, substitui o route.
  readonly initialEntries?: readonly string[]
  // Itens já no carrinho: gravados no storage do jsdom (em memória e limpo
  // depois de cada teste) antes de montar o CartProvider.
  readonly cartItems?: readonly CartItem[]
}

// Envolve o componente nos providers da aplicação: Mantine em modo de teste
// (sem transições nem portais), notificações, roteador em memória e carrinho.
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    initialEntries,
    cartItems,
    ...options
  }: RenderWithProvidersOptions = {},
): RenderResult {
  const entries = initialEntries ?? [route]
  if (cartItems !== undefined) {
    writeCartItems(cartItems)
  }

  function Providers({ children }: { readonly children: ReactNode }) {
    return (
      <MantineProvider theme={theme} env="test">
        <Notifications />
        <MemoryRouter
          initialEntries={[...entries]}
          initialIndex={entries.length - 1}
        >
          <CartProvider>{children}</CartProvider>
        </MemoryRouter>
      </MantineProvider>
    )
  }

  return render(ui, { wrapper: Providers, ...options })
}
