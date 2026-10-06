import { type CartItem, storedCartSchema } from '@/schemas/cart'
import { createStorageItem } from './storage'

export const CART_STORAGE_KEY = 'dummy:cart:v1'

const storedCart = createStorageItem({
  key: CART_STORAGE_KEY,
  schema: storedCartSchema,
})

// Itens salvos no navegador. Carrinho ausente ou inválido (o schema o descarta)
// vira um carrinho vazio.
export function readCartItems(): readonly CartItem[] {
  return storedCart.read()?.items ?? []
}

export function writeCartItems(items: readonly CartItem[]): void {
  storedCart.write({ version: 1, items: [...items] })
}
