import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CART_STORAGE_KEY,
  readCartItems,
  writeCartItems,
} from '@/lib/cart-storage'
import { mascaraItem, mascaraProduct, paletteItem } from '@/test/cart'
import { useCart } from '../hooks/useCart'
import { CartProvider } from './CartProvider'

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider })
}

// Simula outra aba: grava (ou limpa) o storage e dispara o evento storage, que
// o navegador só entrega às outras abas.
function changeInAnotherTab(key: string | null, change: () => void) {
  act(() => {
    change()
    window.dispatchEvent(new StorageEvent('storage', { key }))
  })
}

describe('CartProvider', () => {
  it('começa com o carrinho salvo no navegador', () => {
    writeCartItems([{ ...mascaraItem, quantity: 3 }])

    const { result } = renderCart()

    expect(result.current.items).toEqual([{ ...mascaraItem, quantity: 3 }])
    expect(result.current.totals.itemCount).toBe(3)
  })

  it('grava cada mudança em dummy:cart:v1', () => {
    const { result } = renderCart()

    act(() => {
      result.current.addItem(mascaraProduct, 2)
    })

    expect(readCartItems()).toEqual([{ ...mascaraItem, quantity: 2 }])
  })

  it('acompanha o carrinho alterado em outra aba', () => {
    const { result } = renderCart()

    changeInAnotherTab(CART_STORAGE_KEY, () => {
      writeCartItems([paletteItem])
    })

    expect(result.current.items).toEqual([paletteItem])
  })

  it('esvazia quando outra aba limpa o storage e ignora outras chaves', () => {
    writeCartItems([mascaraItem])
    const { result } = renderCart()

    changeInAnotherTab('dummy:auth:v1', () => {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    })
    expect(result.current.items).toEqual([mascaraItem])

    changeInAnotherTab(null, () => {
      window.localStorage.clear()
    })
    expect(result.current.items).toEqual([])
  })

  it('para de ouvir o evento storage ao desmontar', () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderCart()
    const listener = addListener.mock.calls.find(
      ([type]) => type === 'storage',
    )?.[1]

    unmount()

    expect(listener).toBeDefined()
    expect(removeListener).toHaveBeenCalledWith('storage', listener)
  })
})
