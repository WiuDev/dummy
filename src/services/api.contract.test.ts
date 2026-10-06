import { beforeAll, describe, expect, it } from 'vitest'
import { createSession, writeSession } from '@/lib/auth-session'
import type { AuthSession } from '@/schemas/auth'
import { login } from './auth.service'
import { checkout } from './carts.service'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProduct,
  listProducts,
  listProductsByCategory,
  searchProducts,
  updateProduct,
} from './products.service'

// Contrato com a DummyJSON real (D75), para o que a aplicação usa. Cada chamada
// passa pelo service, que valida a resposta com o schema da aplicação: se a API
// mudar o formato, o service lança e o teste falha. Fica fora do yarn test e do
// verify, que não saem para a rede; roda com yarn test:contract e no job
// semanal (contract.yml).

const PAGE = { limit: 5, skip: 0 } as const

describe('contrato da DummyJSON', () => {
  it('lista, busca e filtra por categoria, como o catálogo espera', async () => {
    const page = await listProducts(PAGE)
    expect(page.products).toHaveLength(5)
    expect(page.total).toBeGreaterThan(page.products.length)

    const search = await searchProducts('phone', PAGE)
    expect(search.total).toBeGreaterThan(0)

    const category = await listProductsByCategory('smartphones', PAGE)
    expect(category.products.length).toBeGreaterThan(0)
    expect(
      category.products.every((product) => product.category === 'smartphones'),
    ).toBe(true)
  })

  it('traz o detalhe de um produto e as categorias', async () => {
    expect(await getProduct(1)).toMatchObject({ id: 1 })

    const categories = await getCategories()
    expect(categories.map((category) => category.slug)).toContain('smartphones')
  })

  describe('com login', () => {
    let session: AuthSession

    beforeAll(async () => {
      // A conta pública de teste da DummyJSON. Fora do navegador, a sessão fica
      // no storage em memória, e o interceptor envia o Bearer dela.
      session = createSession(
        await login({ username: 'emilys', password: 'emilyspass' }),
      )
      writeSession(session)
    })

    it('lê os produtos pelas rotas /auth, com o Bearer', async () => {
      const page = await listProducts(PAGE, { scope: 'admin' })
      expect(page.products).toHaveLength(5)
      expect(await getProduct(1, { scope: 'admin' })).toMatchObject({ id: 1 })
    })

    it('simula o cadastro, a edição e a exclusão de produtos', async () => {
      expect(
        await createProduct({ title: 'Contrato', price: 10 }),
      ).toMatchObject({ title: 'Contrato', price: 10 })
      expect(await updateProduct(1, { price: 12.5 })).toMatchObject({
        id: 1,
        price: 12.5,
      })
      expect(await deleteProduct(1)).toMatchObject({ id: 1, isDeleted: true })
    })

    it('aceita o pedido do checkout', async () => {
      const cart = await checkout({
        userId: session.user.id,
        products: [{ id: 1, quantity: 2 }],
      })
      expect(cart).toMatchObject({ totalProducts: 1, totalQuantity: 2 })
    })
  })
})
