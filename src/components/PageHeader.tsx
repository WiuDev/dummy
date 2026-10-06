import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  readonly title: string
  readonly description?: ReactNode
  // Ações ou informações exibidas ao lado do título.
  readonly children?: ReactNode
}

// Cabeçalho de página: o título é o h1, com descrição e ações opcionais.
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-end" gap="md" mb="lg">
      <Stack gap={4}>
        <Title order={1}>{title}</Title>
        {description === undefined ? null : (
          <Text c="dimmed">{description}</Text>
        )}
      </Stack>
      {children}
    </Group>
  )
}
