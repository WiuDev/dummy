import { Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  readonly title: string
  readonly description?: ReactNode
  // Ações para sair do estado vazio (ex.: limpar os filtros).
  readonly children?: ReactNode
}

// Mensagem para listas sem resultado.
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <Stack align="center" gap="sm" py="xl" ta="center">
      <Title order={2} size="h3">
        {title}
      </Title>
      {description === undefined ? null : <Text c="dimmed">{description}</Text>}
      {children}
    </Stack>
  )
}
