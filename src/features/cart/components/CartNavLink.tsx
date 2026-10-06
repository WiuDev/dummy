import { Badge } from '@mantine/core'
import { AppNavLink } from '@/components/AppNavLink'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { useCart } from '../hooks/useCart'

export interface CartNavLinkProps {
  // No menu mobile, fecha o Drawer ao navegar.
  readonly onClick?: () => void
}

// Link do carrinho na navegação, com a soma das quantidades num selo. O número
// sozinho não diz o que conta, então o nome acessível vem do aria-label
// ("Carrinho, 3 itens").
export function CartNavLink({ onClick }: CartNavLinkProps) {
  const { totals } = useCart()
  const count = totals.itemCount

  return (
    <AppNavLink
      to={paths.cart}
      onClick={onClick}
      aria-label={
        count > 0
          ? `Carrinho, ${formatCount(count, 'item', 'itens')}`
          : undefined
      }
    >
      Carrinho
      {count > 0 ? (
        <Badge size="sm" ml={6}>
          {count > 99 ? '99+' : count}
        </Badge>
      ) : null}
    </AppNavLink>
  )
}
