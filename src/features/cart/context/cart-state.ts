import { discountedPriceCents, toCents } from '@/lib/pricing'
import type { CartItem } from '@/schemas/cart'

// Funções puras do carrinho (D41): nunca alteram o que recebem e devolvem
// arrays e objetos novos, com spread. Os itens que não mudam são reaproveitados,
// e sem mudança nenhuma volta o mesmo array.

// Dados do produto que o carrinho guarda. Um Product completo também serve:
// só esses campos entram no item.
export type CartProduct = Omit<CartItem, 'quantity'>

export interface CartTotals {
  // Soma das quantidades.
  readonly itemCount: number
  // Preço cheio, sem os descontos.
  readonly subtotalCents: number
  readonly discountCents: number
  readonly totalCents: number
}

const EMPTY_TOTALS: CartTotals = {
  itemCount: 0,
  subtotalCents: 0,
  discountCents: 0,
  totalCents: 0,
}

// Quantidade inteira entre 1 e o estoque.
export function clampQuantity(quantity: number, stock: number): number {
  const whole = Number.isFinite(quantity) ? Math.trunc(quantity) : 1
  return Math.min(Math.max(whole, 1), stock)
}

export function findCartItem(
  items: readonly CartItem[],
  productId: number,
): CartItem | undefined {
  return items.find((item) => item.id === productId)
}

// Só os campos que o carrinho guarda, na ordem do schema.
function toCartItem(product: CartProduct, quantity: number): CartItem {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    discountPercentage: product.discountPercentage,
    stock: product.stock,
    thumbnail: product.thumbnail,
    quantity,
  }
}

// Soma a quantidade à que já está no carrinho, sem passar do estoque atual do
// produto. Produto esgotado não entra.
export function addItem(
  items: readonly CartItem[],
  product: CartProduct,
  quantity: number,
): readonly CartItem[] {
  if (product.stock < 1) {
    return items
  }
  if (findCartItem(items, product.id) === undefined) {
    return [
      ...items,
      toCartItem(product, clampQuantity(quantity, product.stock)),
    ]
  }
  return items.map((item) =>
    item.id === product.id
      ? {
          ...item,
          stock: product.stock,
          quantity: clampQuantity(item.quantity + quantity, product.stock),
        }
      : item,
  )
}

// Troca a quantidade, entre 1 e o estoque: tirar do carrinho é só pelo
// removeItem.
export function updateQuantity(
  items: readonly CartItem[],
  productId: number,
  quantity: number,
): readonly CartItem[] {
  const current = findCartItem(items, productId)
  if (
    current === undefined ||
    clampQuantity(quantity, current.stock) === current.quantity
  ) {
    return items
  }
  return items.map((item) =>
    item.id === productId
      ? { ...item, quantity: clampQuantity(quantity, item.stock) }
      : item,
  )
}

export function removeItem(
  items: readonly CartItem[],
  productId: number,
): readonly CartItem[] {
  return findCartItem(items, productId) === undefined
    ? items
    : items.filter((item) => item.id !== productId)
}

// Total de uma linha: o preço unitário com desconto é arredondado para
// centavos uma vez e multiplicado pela quantidade.
export function lineTotalCents(item: CartItem): number {
  return (
    discountedPriceCents(item.price, item.discountPercentage) * item.quantity
  )
}

// Totais em centavos inteiros, sem erro de arredondamento ao somar.
export function cartTotals(items: readonly CartItem[]): CartTotals {
  return items.reduce<CartTotals>((totals, item) => {
    const fullCents = toCents(item.price) * item.quantity
    const finalCents = lineTotalCents(item)
    return {
      itemCount: totals.itemCount + item.quantity,
      subtotalCents: totals.subtotalCents + fullCents,
      discountCents: totals.discountCents + fullCents - finalCents,
      totalCents: totals.totalCents + finalCents,
    }
  }, EMPTY_TOTALS)
}
