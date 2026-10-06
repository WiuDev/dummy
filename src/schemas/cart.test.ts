import { describe, expect, it } from 'vitest'
import { mascaraItem, paletteItem } from '@/test/cart'
import cartAddFixture from '@/test/fixtures/cart-add.json'
import {
  cartResponseSchema,
  checkoutRequestSchema,
  storedCartSchema,
} from './cart'

describe('carrinho salvo', () => {
  it('aceita itens com quantidade até o estoque', () => {
    expect(
      storedCartSchema.safeParse({
        version: 1,
        items: [mascaraItem, { ...paletteItem, quantity: 34 }],
      }).success,
    ).toBe(true)
  })

  it('rejeita quantidade zero ou acima do estoque e produto repetido', () => {
    expect(
      storedCartSchema.safeParse({
        version: 1,
        items: [{ ...mascaraItem, quantity: 0 }],
      }).success,
    ).toBe(false)
    expect(
      storedCartSchema.safeParse({
        version: 1,
        items: [{ ...paletteItem, quantity: 35 }],
      }).success,
    ).toBe(false)
    expect(
      storedCartSchema.safeParse({
        version: 1,
        items: [mascaraItem, { ...mascaraItem, quantity: 2 }],
      }).success,
    ).toBe(false)
  })
})

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
