import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import cartAddFixture from '@/test/fixtures/cart-add.json'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { seedActiveSession } from '@/test/session'
import { checkout } from './carts.service'

const ORDER = {
  userId: 1,
  products: [
    { id: 1, quantity: 2 },
    { id: 121, quantity: 1 },
  ],
}

describe('checkout', () => {
  it('envia o pedido pela rota autenticada e devolve o carrinho', async () => {
    const session = seedActiveSession()
    const requests = recordRequests()

    const cart = await checkout(ORDER)

    expect(await summarizeRequest(requests[0])).toEqual({
      method: 'POST',
      path: '/auth/carts/add',
      params: {},
      authorization: `Bearer ${session.accessToken}`,
      body: ORDER,
    })
    expect(cart).toEqual(cartAddFixture)
  })

  it.each([
    ['sem itens', { userId: 1, products: [] }],
    ['com quantidade zero', { userId: 1, products: [{ id: 1, quantity: 0 }] }],
  ])('rejeita o pedido %s sem enviá-lo', async (_case, order) => {
    seedActiveSession()
    const requests = recordRequests()

    await expect(checkout(order)).rejects.toMatchObject({
      kind: 'bad_request',
      message: 'O carrinho está vazio ou tem quantidades inválidas.',
    })
    expect(requests).toEqual([])
  })

  it('falha quando a API descarta produtos do pedido', async () => {
    seedActiveSession()
    // Resposta real da API para um id de produto que ela não conhece.
    server.use(
      http.post(`${API_URL}/auth/carts/add`, () =>
        HttpResponse.json(
          {
            id: 209,
            products: [],
            total: 0,
            discountedTotal: 0,
            userId: 1,
            totalProducts: 0,
            totalQuantity: 0,
          },
          { status: 201 },
        ),
      ),
    )

    await expect(checkout(ORDER)).rejects.toMatchObject({
      kind: 'invalid_response',
      message:
        'Alguns produtos do carrinho não estão mais disponíveis. Revise o carrinho e tente de novo.',
    })
  })
})
