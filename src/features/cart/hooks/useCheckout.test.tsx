import { act, renderHook } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/features/auth'
import { writeSession } from '@/lib/auth-session'
import { readCartItems, writeCartItems } from '@/lib/cart-storage'
import type { CartItem } from '@/schemas/cart'
import { mascaraItem, paletteItem } from '@/test/cart'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { activeSession } from '@/test/session'
import { CartProvider } from '../context/CartProvider'
import { useCart } from './useCart'
import { useCheckout } from './useCheckout'

function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}

function renderCheckout(
  items: readonly CartItem[],
  { signedIn = true }: { readonly signedIn?: boolean } = {},
) {
  writeCartItems(items)
  if (signedIn) {
    writeSession(activeSession())
  }
  return renderHook(() => ({ checkout: useCheckout(), cart: useCart() }), {
    wrapper: Providers,
  })
}

const ITEMS = [{ ...mascaraItem, quantity: 2 }, paletteItem]

describe('useCheckout', () => {
  it('envia o carrinho com o Bearer, confirma o pedido e limpa o carrinho', async () => {
    const requests = recordRequests()
    const { result } = renderCheckout(ITEMS)

    await act(async () => {
      await result.current.checkout.placeOrder()
    })

    expect(result.current.checkout.state).toEqual({
      status: 'success',
      data: { orderId: 209, itemCount: 3, totalCents: 3423 },
    })
    expect(await summarizeRequest(requests[0])).toMatchObject({
      method: 'POST',
      path: '/auth/carts/add',
      authorization: `Bearer ${activeSession().accessToken}`,
      body: {
        userId: 1,
        products: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 1 },
        ],
      },
    })
    expect(result.current.cart.items).toEqual([])
    expect(readCartItems()).toEqual([])
  })

  it('na falha, mantém o carrinho', async () => {
    server.use(
      http.post(`${API_URL}/auth/carts/add`, () =>
        HttpResponse.json({ message: 'falhou' }, { status: 500 }),
      ),
    )
    const { result } = renderCheckout(ITEMS)

    await act(async () => {
      await result.current.checkout.placeOrder()
    })

    expect(result.current.checkout.state).toMatchObject({
      status: 'error',
      error: { kind: 'server' },
    })
    expect(result.current.cart.items).toEqual(ITEMS)
  })

  it('quando a API descarta produtos, falha e mantém o carrinho', async () => {
    const items = [mascaraItem, { ...paletteItem, id: 9999 }]
    const { result } = renderCheckout(items)

    await act(async () => {
      await result.current.checkout.placeOrder()
    })

    expect(result.current.checkout.state).toMatchObject({
      status: 'error',
      error: {
        kind: 'invalid_response',
        message:
          'Alguns produtos do carrinho não estão mais disponíveis. Revise o carrinho e tente de novo.',
      },
    })
    expect(result.current.cart.items).toEqual(items)
  })

  it('sem sessão, não envia nada', async () => {
    const requests = recordRequests()
    const { result } = renderCheckout(ITEMS, { signedIn: false })

    let outcome: unknown
    await act(async () => {
      outcome = await result.current.checkout.placeOrder()
    })

    expect(outcome).toMatchObject({
      ok: false,
      error: { kind: 'unauthorized' },
    })
    expect(requests).toEqual([])
    expect(result.current.cart.items).toEqual(ITEMS)
  })

  it('desmontar no meio do envio mantém o carrinho', async () => {
    server.use(
      http.post(`${API_URL}/auth/carts/add`, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    const { result, unmount } = renderCheckout(ITEMS)

    let pending: Promise<unknown> = Promise.resolve()
    act(() => {
      pending = result.current.checkout.placeOrder()
    })
    unmount()

    await expect(pending).resolves.toMatchObject({
      ok: false,
      error: { kind: 'canceled' },
    })
    expect(readCartItems()).toEqual(ITEMS)
  })
})
