import { describe, expect, it } from 'vitest'
import cartAddFixture from '@/test/fixtures/cart-add.json'
import { cartResponseSchema, checkoutRequestSchema } from './cart'

describe('contrato do carrinho', () => {
  it('aceita a resposta de POST /auth/carts/add', () => {
    const result = cartResponseSchema.safeParse(cartAddFixture)

    expect(result.success).toBe(true)
    expect(result.data?.totalProducts).toBe(2)
  })

  it('aceita pedido com ao menos um item', () => {
    expect(
      checkoutRequestSchema.safeParse({
        userId: 1,
        products: [{ id: 1, quantity: 2 }],
      }).success,
    ).toBe(true)
  })

  it('rejeita pedido vazio ou com quantidade inválida', () => {
    expect(
      checkoutRequestSchema.safeParse({ userId: 1, products: [] }).success,
    ).toBe(false)
    expect(
      checkoutRequestSchema.safeParse({
        userId: 1,
        products: [{ id: 1, quantity: 0 }],
      }).success,
    ).toBe(false)
    expect(
      checkoutRequestSchema.safeParse({
        userId: 1,
        products: [{ id: 1, quantity: 1.5 }],
      }).success,
    ).toBe(false)
  })
})
