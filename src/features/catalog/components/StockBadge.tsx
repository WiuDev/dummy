import { Badge, type MantineColor } from '@mantine/core'

export interface StockBadgeProps {
  readonly stock: number
  readonly availabilityStatus: string
}

type StockLevel = 'in-stock' | 'low-stock' | 'out-of-stock'

// A API manda o status em inglês; a interface mostra o rótulo em pt-BR (D43).
const STOCK_LABELS: Readonly<Record<StockLevel, string>> = {
  'in-stock': 'Em estoque',
  'low-stock': 'Estoque baixo',
  'out-of-stock': 'Esgotado',
}

const STOCK_COLORS: Readonly<Record<StockLevel, MantineColor>> = {
  'in-stock': 'green',
  'low-stock': 'yellow',
  'out-of-stock': 'red',
}

// Os status da API são "In Stock", "Low Stock" e "Out of Stock". Um status
// desconhecido é decidido pelo estoque.
function stockLevel(stock: number, availabilityStatus: string): StockLevel {
  if (stock <= 0 || availabilityStatus === 'Out of Stock') {
    return 'out-of-stock'
  }
  if (availabilityStatus === 'Low Stock') {
    return 'low-stock'
  }
  return 'in-stock'
}

export function StockBadge({ stock, availabilityStatus }: StockBadgeProps) {
  const level = stockLevel(stock, availabilityStatus)

  return (
    <Badge color={STOCK_COLORS[level]} variant="light">
      {STOCK_LABELS[level]}
    </Badge>
  )
}
