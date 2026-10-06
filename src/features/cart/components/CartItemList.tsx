import type { CartItem } from '@/schemas/cart'
import classes from './CartItemList.module.css'
import { CartItemRow } from './CartItemRow'

export interface CartItemListProps {
  readonly items: readonly CartItem[]
  readonly onQuantityChange: (productId: number, quantity: number) => void
  readonly onRemove: (productId: number) => void
  // Durante o envio do pedido, o carrinho não muda.
  readonly disabled?: boolean
}

export function CartItemList({
  items,
  onQuantityChange,
  onRemove,
  disabled = false,
}: CartItemListProps) {
  return (
    <ul aria-label="Itens do carrinho" className={classes.list}>
      {items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </ul>
  )
}
