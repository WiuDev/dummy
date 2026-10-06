import { AppError } from '@/lib/errors'
import {
  type CartResponse,
  cartResponseSchema,
  type CheckoutRequest,
  checkoutRequestSchema,
} from '@/schemas/cart'
import { api, type RequestOptions } from './api'
import { parseResponse } from './parse-response'

export async function checkout(
  request: CheckoutRequest,
  { signal }: RequestOptions = {},
): Promise<CartResponse> {
  // O tipo não garante itens nem quantidades positivas; sem isso, nem envia.
  const parsed = checkoutRequestSchema.safeParse(request)
  if (!parsed.success) {
    throw new AppError(
      'bad_request',
      'O carrinho está vazio ou tem quantidades inválidas.',
      { cause: parsed.error },
    )
  }

  const path = '/auth/carts/add'
  const { data } = await api.post<unknown>(path, parsed.data, { signal })
  const cart = parseResponse(cartResponseSchema, data, `POST ${path}`)

  // A API descarta sem avisar os produtos que não conhece e responde 201.
  if (cart.totalProducts !== parsed.data.products.length) {
    throw new AppError(
      'invalid_response',
      'Alguns produtos do carrinho não estão mais disponíveis. Revise o carrinho e tente de novo.',
    )
  }
  return cart
}
