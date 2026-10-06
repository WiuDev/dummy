import { describe, expect, it } from 'vitest'
import { mascaraItem, paletteItem } from '@/test/cart'
import { CART_STORAGE_KEY, readCartItems, writeCartItems } from './cart-storage'

describe('cart-storage', () => {
  it('grava os itens com a versão e os lê de volta', () => {
    writeCartItems([mascaraItem, paletteItem])

    const stored: unknown = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) ?? 'null',
    )
    expect(stored).toEqual({ version: 1, items: [mascaraItem, paletteItem] })
    expect(readCartItems()).toEqual([mascaraItem, paletteItem])
  })

  it('sem carrinho salvo, começa vazio', () => {
    expect(readCartItems()).toEqual([])
  })

  it.each([
    ['JSON inválido', '{'],
    ['outra versão', JSON.stringify({ version: 2, items: [] })],
    [
      'quantidade acima do estoque',
      JSON.stringify({
        version: 1,
        items: [{ ...mascaraItem, quantity: 100 }],
      }),
    ],
    [
      'produto repetido',
      JSON.stringify({ version: 1, items: [mascaraItem, mascaraItem] }),
    ],
  ])('descarta o carrinho salvo com %s', (_reason, raw) => {
    window.localStorage.setItem(CART_STORAGE_KEY, raw)

    expect(readCartItems()).toEqual([])
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBeNull()
  })
})
