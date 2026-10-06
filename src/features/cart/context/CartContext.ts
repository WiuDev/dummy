import { createContext } from 'react'
import type { CartItem } from '@/schemas/cart'
import type { CartProduct, CartTotals } from './cart-state'

export interface CartContextValue {
  readonly items: readonly CartItem[]
  // Totais em centavos, recalculados só quando os itens mudam.
  readonly totals: CartTotals
  // Soma ao que já está no carrinho, sem passar do estoque.
  readonly addItem: (product: CartProduct, quantity: number) => void
  // Entre 1 e o estoque; para tirar o item, use removeItem.
  readonly updateQuantity: (productId: number, quantity: number) => void
  readonly removeItem: (productId: number) => void
  readonly clear: () => void
}

// Sem valor padrão: fora do CartProvider, o useCart lança um erro.
export const CartContext = createContext<CartContextValue | null>(null)
