import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import categoriesFixture from '@/test/fixtures/categories.json'
import product1Fixture from '@/test/fixtures/product-1.json'
import productAddFixture from '@/test/fixtures/product-add.json'
import productDeleteFixture from '@/test/fixtures/product-delete.json'
import productUpdateFixture from '@/test/fixtures/product-update.json'
import smartphonesFixture from '@/test/fixtures/products-category-smartphones.json'
import productsPageFixture from '@/test/fixtures/products-page.json'
import searchPhoneFixture from '@/test/fixtures/products-search-phone.json'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { seedActiveSession } from '@/test/session'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProduct,
  listProducts,
  listProductsByCategory,
  type ProductRequestOptions,
  searchProducts,
  updateProduct,
} from './products.service'

const SUMMARY_SELECT =
  'title,price,discountPercentage,rating,stock,thumbnail,category,brand,availabilityStatus'
const PAGE = { limit: 2, skip: 0 }
const ADMIN: ProductRequestOptions = { scope: 'admin' }

describe('leitura pública', () => {
  it('lista uma página pedindo só os campos do resumo', async () => {
    const requests = recordRequests()

    const page = await listProducts(PAGE)

    expect(await summarizeRequest(requests[0])).toEqual({
      method: 'GET',
      path: '/products',
      params: { limit: '2', skip: '0', select: SUMMARY_SELECT },
      authorization: null,
      body: undefined,
    })
    expect(page).toEqual(productsPageFixture)
  })

  it('envia a ordenação quando pedida', async () => {
    const requests = recordRequests()

    await listProducts({ limit: 12, skip: 24, sortBy: 'price', order: 'desc' })

    const { params } = await summarizeRequest(requests[0])
    expect(params).toEqual({
      limit: '12',
      skip: '24',
      sortBy: 'price',
      order: 'desc',
      select: SUMMARY_SELECT,
    })
  })

  it('busca pelo termo com a mesma paginação', async () => {
    const requests = recordRequests()

    const page = await searchProducts('phone', PAGE)

    const { path, params } = await summarizeRequest(requests[0])
    expect(path).toBe('/products/search')
    expect(params).toEqual({
      q: 'phone',
      limit: '2',
      skip: '0',
      select: SUMMARY_SELECT,
    })
    expect(page).toEqual({
      products: searchPhoneFixture.products.slice(0, 2),
      total: 23,
      skip: 0,
      limit: 2,
    })
  })

  it('lista por categoria', async () => {
    const requests = recordRequests()

    const page = await listProductsByCategory('smartphones', PAGE)

    const { path, params } = await summarizeRequest(requests[0])
    expect(path).toBe('/products/category/smartphones')
    expect(params).toEqual({ limit: '2', skip: '0', select: SUMMARY_SELECT })
    expect(page).toEqual(smartphonesFixture)
  })

  it('codifica o slug da categoria na URL', async () => {
    const requests = recordRequests()

    const page = await listProductsByCategory('casa & jardim', PAGE)

    const { path } = await summarizeRequest(requests[0])
    expect(path).toBe('/products/category/casa%20%26%20jardim')
    expect(page.total).toBe(0)
  })

  it('carrega o produto completo', async () => {
    const requests = recordRequests()

    const product = await getProduct(1)

    const { path } = await summarizeRequest(requests[0])
    expect(path).toBe('/products/1')
    expect(product).toEqual(product1Fixture)
  })

  it('informa produto inexistente como not_found', async () => {
    await expect(getProduct(9999)).rejects.toMatchObject({
      kind: 'not_found',
      status: 404,
      serverMessage: "Product with id '9999' not found",
    })
  })

  it('carrega as categorias', async () => {
    const requests = recordRequests()

    const categories = await getCategories()

    const { path } = await summarizeRequest(requests[0])
    expect(path).toBe('/products/categories')
    expect(categories).toEqual(categoriesFixture)
  })

  it('rejeita a resposta fora do contrato com invalid_response', async () => {
    server.use(
      http.get(`${API_URL}/products`, () =>
        HttpResponse.json({ products: 'nenhum' }),
      ),
    )

    await expect(listProducts(PAGE)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })
})

describe('leitura do admin (scope admin)', () => {
  it.each<[string, () => Promise<unknown>, string]>([
    ['listProducts', () => listProducts(PAGE, ADMIN), '/auth/products'],
    [
      'searchProducts',
      () => searchProducts('phone', PAGE, ADMIN),
      '/auth/products/search',
    ],
    [
      'listProductsByCategory',
      () => listProductsByCategory('smartphones', PAGE, ADMIN),
      '/auth/products/category/smartphones',
    ],
    ['getProduct', () => getProduct(1, ADMIN), '/auth/products/1'],
  ])(
    '%s lê pela rota /auth com o Bearer',
    async (_name, read, expectedPath) => {
      const session = seedActiveSession()
      const requests = recordRequests()

      await read()

      const { path, authorization } = await summarizeRequest(requests[0])
      expect(path).toBe(expectedPath)
      expect(authorization).toBe(`Bearer ${session.accessToken}`)
    },
  )
})

describe('escrita (sempre pelas rotas /auth)', () => {
  it('cria o produto com os campos enviados', async () => {
    const session = seedActiveSession()
    const requests = recordRequests()
    const input = { title: 'Produto de teste', price: 10, category: 'beauty' }

    const created = await createProduct(input)

    expect(await summarizeRequest(requests[0])).toEqual({
      method: 'POST',
      path: '/auth/products/add',
      params: {},
      authorization: `Bearer ${session.accessToken}`,
      body: input,
    })
    expect(created).toEqual(productAddFixture)
  })

  it('edita o produto', async () => {
    seedActiveSession()
    const requests = recordRequests()

    const updated = await updateProduct(1, { title: 'Produto editado' })

    const { method, path, body } = await summarizeRequest(requests[0])
    expect({ method, path, body }).toEqual({
      method: 'PUT',
      path: '/auth/products/1',
      body: { title: 'Produto editado' },
    })
    expect(updated).toEqual(productUpdateFixture)
  })

  it('exclui o produto', async () => {
    seedActiveSession()
    const requests = recordRequests()

    const deleted = await deleteProduct(1)

    const { method, path } = await summarizeRequest(requests[0])
    expect({ method, path }).toEqual({
      method: 'DELETE',
      path: '/auth/products/1',
    })
    expect(deleted).toEqual(productDeleteFixture)
    expect(deleted.isDeleted).toBe(true)
  })

  it('informa a edição de um produto que a API não conhece como not_found', async () => {
    seedActiveSession()

    await expect(updateProduct(195, { title: 'x' })).rejects.toMatchObject({
      kind: 'not_found',
    })
  })
})
