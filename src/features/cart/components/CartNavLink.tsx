import { Badge } from '@mantine/core'
import { IconShoppingCart } from '@tabler/icons-react'
import { AppNavLink } from '@/components/AppNavLink'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { useCart } from '../hooks/useCart'

export interface CartNavLinkProps {
  // No cabeçalho do celular, só o ícone e o selo (D71).
  readonly compact?: boolean
}

// Link do carrinho, com a soma das quantidades num selo. O número sozinho não
// diz o que conta, então o nome acessível vem do aria-label ("Carrinho, 3
// itens"); na versão compacta, sem texto visível, ele é sempre o nome.
export function CartNavLink({ compact = false }: CartNavLinkProps) {
  const { totals } = useCart()
  const count = totals.itemCount
  const label =
    count > 0 ? `Carrinho, ${formatCount(count, 'item', 'itens')}` : 'Carrinho'

  return (
    <AppNavLink
      to={paths.cart}
      aria-label={compact || count > 0 ? label : undefined}
    >
      {compact ? (
        <IconShoppingCart aria-hidden size={22} stroke={1.75} />
      ) : (
        'Carrinho'
      )}
      {count > 0 ? (
        <Badge size="sm" ml={6}>
          {count > 99 ? '99+' : count}
        </Badge>
      ) : null}
    </AppNavLink>
  )
}
