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

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  'wrapper'
> {
  readonly route?: string
  // Histórico inicial, para simular a navegação anterior; a última entrada é a
  // rota atual. Quando informado, substitui o route.
  readonly initialEntries?: readonly string[]
}

// Envolve o componente nos providers da aplicação: Mantine em modo de teste
// (sem transições nem portais), notificações e roteador em memória.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', initialEntries, ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  const entries = initialEntries ?? [route]

  function Providers({ children }: { readonly children: ReactNode }) {
    return (
      <MantineProvider theme={theme} env="test">
        <Notifications />
        <MemoryRouter
          initialEntries={[...entries]}
          initialIndex={entries.length - 1}
        >
          {children}
        </MemoryRouter>
      </MantineProvider>
    )
  }

  return render(ui, { wrapper: Providers, ...options })
}
