import { Card, Divider, Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { formatCents } from '@/lib/format'
import type { CartTotals } from '../context/cart-state'

export interface CartSummaryProps {
  readonly totals: CartTotals
  // Ações abaixo dos totais (o "Finalizar compra" e o aviso de falha).
  readonly children: ReactNode
}

const SUMMARY_TITLE_ID = 'resumo-do-carrinho'

// Resumo com os totais, calculados em centavos. Os rótulos e valores formam uma
// lista de definições (dl).
export function CartSummary({ totals, children }: CartSummaryProps) {
  return (
    <Card
      component="section"
      aria-labelledby={SUMMARY_TITLE_ID}
      withBorder
      radius="md"
      padding="lg"
    >
      <Title order={2} size="h4" id={SUMMARY_TITLE_ID} mb="sm">
        Resumo
      </Title>
      <Stack component="dl" gap="xs" m={0}>
        <Group justify="space-between">
          <Text component="dt">Subtotal</Text>
          <Text component="dd" m={0}>
            {formatCents(totals.subtotalCents)}
          </Text>
        </Group>
        {totals.discountCents > 0 ? (
          <Group justify="space-between">
            <Text component="dt">Descontos</Text>
            <Text component="dd" m={0} c="green">
              -{formatCents(totals.discountCents)}
            </Text>
          </Group>
        ) : null}
        <Divider />
        <Group justify="space-between">
          <Text component="dt" fw={700}>
            Total
          </Text>
          <Text component="dd" m={0} fw={700} size="lg">
            {formatCents(totals.totalCents)}
          </Text>
        </Group>
      </Stack>
      <Stack gap="sm" mt="md">
        {children}
      </Stack>
      <Text size="xs" c="dimmed" mt="sm">
        Preços em dólar (USD).
      </Text>
    </Card>
  )
}
