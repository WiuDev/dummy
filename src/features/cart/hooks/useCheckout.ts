import { useCallback } from 'react'
import { useAuth } from '@/features/auth'
import {
  type ActionResult,
  type AsyncActionState,
  useAsyncAction,
} from '@/hooks/useAsyncAction'
import { AppError } from '@/lib/errors'
import type { CartItem } from '@/schemas/cart'
import { checkout } from '@/services/carts.service'
import { cartTotals } from '../context/cart-state'
import { useCart } from './useCart'

// Pedido confirmado: o número dado pela API e o total calculado pelo carrinho,
// em centavos, para a confirmação mostrar o mesmo valor do resumo.
export interface PlacedOrder {
  readonly orderId: number
  readonly itemCount: number
  readonly totalCents: number
}

export interface UseCheckoutResult {
  readonly state: AsyncActionState<PlacedOrder>
  // Envia o carrinho. No sucesso, limpa o carrinho; na falha, ele fica.
  readonly placeOrder: () => Promise<ActionResult<PlacedOrder>>
}

async function sendOrder(
  signal: AbortSignal,
  userId: number,
  items: readonly CartItem[],
): Promise<PlacedOrder> {
  const order = await checkout(
    { userId, products: items.map(({ id, quantity }) => ({ id, quantity })) },
    { signal },
  )
  const { itemCount, totalCents } = cartTotals(items)
  return { orderId: order.id, itemCount, totalCents }
}

// Finaliza a compra pelo POST /auth/carts/add, com o Bearer da sessão (D60). O
// checkout() do service já falha quando a API descarta produtos. Desmontar no
// meio do envio aborta a requisição e mantém o carrinho.
export function useCheckout(): UseCheckoutResult {
  const { user } = useAuth()
  const { items, clear } = useCart()
  const { state, run } = useAsyncAction(sendOrder)

  const placeOrder = useCallback(async (): Promise<
    ActionResult<PlacedOrder>
  > => {
    if (user === null) {
      return {
        ok: false,
        error: new AppError(
          'unauthorized',
          'Entre na sua conta para finalizar a compra.',
        ),
      }
    }
    const result = await run(user.id, items)
    if (result.ok) {
      clear()
    }
    return result
  }, [user, items, run, clear])

  return { state, placeOrder }
}
