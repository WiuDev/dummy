import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CART_STORAGE_KEY,
  readCartItems,
  writeCartItems,
} from '@/lib/cart-storage'
import { onStorageKeyChange } from '@/lib/storage'
import type { CartItem } from '@/schemas/cart'
import { CartContext, type CartContextValue } from './CartContext'
import {
  addItem,
  cartTotals,
  type CartProduct,
  removeItem,
  updateQuantity,
} from './cart-state'

export interface CartProviderProps {
  readonly children: ReactNode
}

// Estado global do carrinho: useState com as funções puras de cart-state.ts
// (D41). A hidratação é síncrona, no inicializador, então o carrinho salvo já
// aparece no primeiro render.
export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<readonly CartItem[]>(readCartItems)

  // Grava cada mudança. Regravar o que veio de outra aba não dispara um novo
  // evento storage, porque o valor salvo não muda.
  useEffect(() => {
    writeCartItems(items)
  }, [items])

  // Outra aba mudou ou limpou o carrinho: relê o storage. O cleanup tira o
  // listener ao desmontar.
  useEffect(
    () =>
      onStorageKeyChange(CART_STORAGE_KEY, () => {
        setItems(readCartItems())
      }),
    [],
  )

  const add = useCallback((product: CartProduct, quantity: number) => {
    setItems((current) => addItem(current, product, quantity))
  }, [])

  const update = useCallback((productId: number, quantity: number) => {
    setItems((current) => updateQuantity(current, productId, quantity))
  }, [])

  const remove = useCallback((productId: number) => {
    setItems((current) => removeItem(current, productId))
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totals: cartTotals(items),
      addItem: add,
      updateQuantity: update,
      removeItem: remove,
      clear,
    }),
    [items, add, update, remove, clear],
  )

  return <CartContext value={value}>{children}</CartContext>
}
