import { use } from 'react'
import { CartContext, type CartContextValue } from '../context/CartContext'

// Acesso ao carrinho. Fora do CartProvider, lança um erro em vez de devolver um
// carrinho que não guarda nada.
export function useCart(): CartContextValue {
  const cart = use(CartContext)
  if (cart === null) {
    throw new Error('useCart deve ser usado dentro de <CartProvider>.')
  }
  return cart
}
