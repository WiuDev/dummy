import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mascaraProduct, paletteProduct } from '@/test/cart'
import { CartProvider } from '../context/CartProvider'
import { useCart } from './useCart'

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider })
}

describe('useCart', () => {
  it('fora do CartProvider, lança um erro', () => {
    // O React registra no console o erro lançado durante a renderização.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useCart())).toThrow(
      'useCart deve ser usado dentro de <CartProvider>.',
    )
  })

  it('adiciona, troca a quantidade, remove e esvazia, com os totais em centavos', () => {
    const { result } = renderCart()

    act(() => {
      result.current.addItem(mascaraProduct, 2)
    })
    act(() => {
      result.current.addItem(paletteProduct, 1)
    })

    expect(result.current.items).toEqual([
      { ...mascaraProduct, quantity: 2 },
      { ...paletteProduct, quantity: 1 },
    ])
    expect(result.current.totals).toEqual({
      itemCount: 3,
      subtotalCents: 3997,
      discountCents: 574,
      totalCents: 3423,
    })

    act(() => {
      result.current.updateQuantity(1, 1)
    })
    act(() => {
      result.current.removeItem(2)
    })

    expect(result.current.items).toEqual([{ ...mascaraProduct, quantity: 1 }])

    act(() => {
      result.current.clear()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totals.itemCount).toBe(0)
  })

  it('mantém as ações estáveis entre os renders', () => {
    const { result } = renderCart()
    const { addItem, updateQuantity, removeItem, clear } = result.current

    act(() => {
      result.current.addItem(mascaraProduct, 1)
    })

    expect(result.current.addItem).toBe(addItem)
    expect(result.current.updateQuantity).toBe(updateQuantity)
    expect(result.current.removeItem).toBe(removeItem)
    expect(result.current.clear).toBe(clear)
  })
})
