import { Button, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCircleCheck } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { formatCents, formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import type { PlacedOrder } from '../hooks/useCheckout'

export interface OrderConfirmationProps {
  readonly order: PlacedOrder
}

// Confirmação do pedido, no lugar do carrinho já limpo. Não fica salva (D60):
// ao recarregar, aparece o carrinho vazio.
export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // O foco vai para o título: quem usa leitor de tela fica sabendo do pedido.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Stack align="center" gap="sm" py="xl" ta="center">
      <ThemeIcon color="green" variant="light" size={56} radius="xl">
        <IconCircleCheck size={32} aria-hidden />
      </ThemeIcon>
      <Title order={2} size="h3" ref={headingRef} tabIndex={-1}>
        Pedido confirmado
      </Title>
      <Text>
        Pedido nº {order.orderId}:{' '}
        {formatCount(order.itemCount, 'item', 'itens')}, total de{' '}
        {formatCents(order.totalCents)}.
      </Text>
      <Text size="sm" c="dimmed">
        A DummyJSON simula a compra: nada é cobrado nem enviado.
      </Text>
      <Button component={Link} to={paths.products}>
        Continuar comprando
      </Button>
    </Stack>
  )
}
