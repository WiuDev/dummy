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
}

// Envolve o componente nos providers da aplicação: Mantine em modo de teste
// (sem transições nem portais), notificações e roteador em memória.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  function Providers({ children }: { readonly children: ReactNode }) {
    return (
      <MantineProvider theme={theme} env="test">
        <Notifications />
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </MantineProvider>
    )
  }

  return render(ui, { wrapper: Providers, ...options })
}
