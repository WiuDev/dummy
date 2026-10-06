import { Badge, Group, Text, VisuallyHidden } from '@mantine/core'
import { formatCurrency, formatPercent } from '@/lib/format'
import { discountedPrice } from '@/lib/pricing'

export interface PriceProps {
  readonly price: number
  readonly discountPercentage?: number
  readonly size?: 'md' | 'xl'
}

// Preço final em destaque. Com desconto, mostra também o preço cheio riscado e
// o percentual; os textos ocultos explicam a diferença para leitores de tela.
export function Price({
  price,
  discountPercentage = 0,
  size = 'md',
}: PriceProps) {
  const finalSize = size === 'xl' ? 'xl' : 'lg'

  if (discountPercentage <= 0) {
    return (
      <Text fw={700} size={finalSize}>
        {formatCurrency(price)}
      </Text>
    )
  }

  return (
    <Group gap="xs" align="baseline">
      <Text fw={700} size={finalSize}>
        <VisuallyHidden>Preço com desconto: </VisuallyHidden>
        {formatCurrency(discountedPrice(price, discountPercentage))}
      </Text>
      <Text c="dimmed" size="sm" td="line-through">
        <VisuallyHidden>Preço original: </VisuallyHidden>
        {formatCurrency(price)}
      </Text>
      <Badge color="green" variant="light">
        -{formatPercent(discountPercentage)}
      </Badge>
    </Group>
  )
}
