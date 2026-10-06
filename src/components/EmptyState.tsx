import { Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  readonly title: string
  readonly description?: ReactNode
  // Nível do título: 2 dentro de uma página; 1 quando o estado vazio é o
  // conteúdo principal da página (ex.: produto não encontrado).
  readonly headingOrder?: 1 | 2
  // Ações para sair do estado vazio (ex.: limpar os filtros).
  readonly children?: ReactNode
}

// Mensagem para listas sem resultado ou itens que não existem.
export function EmptyState({
  title,
  description,
  headingOrder = 2,
  children,
}: EmptyStateProps) {
  return (
    <Stack align="center" gap="sm" py="xl" ta="center">
      <Title order={headingOrder} size="h3">
        {title}
      </Title>
      {description === undefined ? null : <Text c="dimmed">{description}</Text>}
      {children}
    </Stack>
  )
}
