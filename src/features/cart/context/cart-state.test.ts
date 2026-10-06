import { describe, expect, it } from 'vitest'
import type { CartItem } from '@/schemas/cart'
import {
  mascaraItem,
  mascaraProduct,
  paletteItem,
  paletteProduct,
} from '@/test/cart'
import {
  addItem,
  cartTotals,
  clampQuantity,
  findCartItem,
  lineTotalCents,
  removeItem,
  updateQuantity,
} from './cart-state'

// Congela o array e cada item: qualquer mutação lançaria TypeError, porque os
// módulos ES rodam em modo estrito.
function frozen(items: readonly CartItem[]): readonly CartItem[] {
  return Object.freeze(items.map((item) => Object.freeze({ ...item })))
}

describe('clampQuantity', () => {
  it.each([
    [3, 10, 3],
    [0, 10, 1],
    [-2, 10, 1],
    [12, 10, 10],
    [2.7, 10, 2],
    [Number.NaN, 10, 1],
  ])('%s com estoque %s vira %s', (quantity, stock, expected) => {
    expect(clampQuantity(quantity, stock)).toBe(expected)
  })
})

describe('addItem', () => {
  it('põe no fim do carrinho um produto novo, só com os campos do item', () => {
    const items = frozen([paletteItem])
    const product = { ...mascaraProduct, description: 'Rímel', rating: 4.9 }

    expect(addItem(items, product, 2)).toEqual([
      paletteItem,
      { ...mascaraProduct, quantity: 2 },
    ])
  })

  it('soma a quantidade de um produto que já está no carrinho', () => {
    const items = frozen([{ ...mascaraItem, quantity: 2 }])

    expect(addItem(items, mascaraProduct, 3)).toEqual([
      { ...mascaraItem, quantity: 5 },
    ])
  })

  it('não passa do estoque atual do produto', () => {
    const items = frozen([{ ...mascaraItem, quantity: 5 }])

    expect(addItem(items, mascaraProduct, 200)).toEqual([
      { ...mascaraItem, quantity: 99 },
    ])
    expect(addItem(items, { ...mascaraProduct, stock: 6 }, 3)).toEqual([
      { ...mascaraItem, stock: 6, quantity: 6 },
    ])
  })

  it('não põe no carrinho um produto esgotado', () => {
    const items = frozen([paletteItem])

    expect(addItem(items, { ...mascaraProduct, stock: 0 }, 1)).toBe(items)
  })
})

describe('updateQuantity', () => {
  it('troca a quantidade, entre 1 e o estoque', () => {
    const items = frozen([mascaraItem, paletteItem])

    expect(updateQuantity(items, 2, 4)).toEqual([
      mascaraItem,
      { ...paletteItem, quantity: 4 },
    ])
    expect(updateQuantity(items, 2, 0)).toBe(items)
    expect(updateQuantity(items, 2, 50)).toEqual([
      mascaraItem,
      { ...paletteItem, quantity: 34 },
    ])
  })

  it('sem mudança, devolve o mesmo array', () => {
    const items = frozen([{ ...mascaraItem, quantity: 3 }])

    expect(updateQuantity(items, 1, 3)).toBe(items)
    expect(updateQuantity(items, 99, 2)).toBe(items)
  })
})

describe('removeItem', () => {
  it('tira o produto do carrinho', () => {
    const items = frozen([mascaraItem, paletteItem])

    expect(removeItem(items, 1)).toEqual([paletteItem])
  })

  it('produto fora do carrinho: devolve o mesmo array', () => {
    const items = frozen([mascaraItem])

    expect(removeItem(items, 2)).toBe(items)
  })
})

describe('imutabilidade', () => {
  it('as funções não alteram o carrinho recebido e reaproveitam os itens que não mudam', () => {
    const items = frozen([mascaraItem, paletteItem])
    const copy = items.map((item) => ({ ...item }))

    const added = addItem(items, mascaraProduct, 1)
    const updated = updateQuantity(items, 2, 3)
    const removed = removeItem(items, 1)
    const appended = addItem(items, { ...paletteProduct, id: 3 }, 1)

    expect(items).toEqual(copy)
    expect(added).not.toBe(items)
    expect(added[0]).not.toBe(items[0])
    expect(added[1]).toBe(items[1])
    expect(updated[0]).toBe(items[0])
    expect(updated[1]).not.toBe(items[1])
    expect(removed[0]).toBe(items[1])
    expect(appended.slice(0, 2)).toEqual(items)
    expect(appended).toHaveLength(3)
  })
})

describe('findCartItem', () => {
  it('acha o item pelo id do produto', () => {
    expect(findCartItem([mascaraItem, paletteItem], 2)).toBe(paletteItem)
    expect(findCartItem([mascaraItem], 2)).toBeUndefined()
  })
})

describe('totais em centavos', () => {
  it('carrinho vazio zera tudo', () => {
    expect(cartTotals([])).toEqual({
      itemCount: 0,
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
    })
  })

  it('soma o preço cheio, os descontos e o total de cada linha', () => {
    const mascaras = { ...mascaraItem, quantity: 2 }

    expect(lineTotalCents(mascaras)).toBe(1788)
    expect(lineTotalCents(paletteItem)).toBe(1635)
    expect(cartTotals([mascaras, paletteItem])).toEqual({
      itemCount: 3,
      subtotalCents: 3997,
      discountCents: 574,
      totalCents: 3423,
    })
  })

  it('não acumula o erro de ponto flutuante', () => {
    // Em dólares, 0,1 + 0,2 dá 0,30000000000000004; em centavos, 30.
    const cheap = { ...mascaraItem, id: 10, price: 0.1, discountPercentage: 0 }
    const other = { ...mascaraItem, id: 11, price: 0.2, discountPercentage: 0 }

    expect(cartTotals([cheap, other]).totalCents).toBe(30)
  })
})
