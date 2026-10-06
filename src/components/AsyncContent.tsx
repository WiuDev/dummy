import { Box, LoadingOverlay } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AsyncState } from '@/hooks/useAsync'
import { ErrorState } from './ErrorState'

export interface AsyncContentProps<T> {
  readonly state: AsyncState<T>
  readonly onRetry: () => void
  // Primeira carga, quando ainda não há dados para mostrar.
  readonly skeleton: ReactNode
  // Conteúdo com os dados. Ao recarregar, recebe os dados anteriores, que
  // ficam sob o LoadingOverlay até a nova resposta chegar.
  readonly children: (data: T) => ReactNode
}

// Renderiza os estados de uma leitura do useAsync: skeleton na primeira carga,
// dados anteriores com overlay ao recarregar, ErrorState com "Tentar
// novamente" na falha e children(data) no sucesso.
export function AsyncContent<T>({
  state,
  onRetry,
  skeleton,
  children,
}: AsyncContentProps<T>) {
  switch (state.status) {
    case 'idle':
      return null
    case 'loading':
      return state.previousData === undefined ? (
        skeleton
      ) : (
        <Box pos="relative" aria-busy="true">
          <LoadingOverlay visible zIndex={1} overlayProps={{ blur: 1 }} />
          {children(state.previousData)}
        </Box>
      )
    case 'error':
      return <ErrorState error={state.error} onRetry={onRetry} />
    case 'success':
      return children(state.data)
  }
}
