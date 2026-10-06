import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { AsyncState } from '@/hooks/useAsync'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import type { CatalogParams } from './useCatalogParams'
import { type CatalogPage, useProducts } from './useProducts'

const SUMMARY_SELECT =
  'title,price,discountPercentage,rating,stock,thumbnail,category,brand,availabilityStatus'

function dataOf(state: AsyncState<CatalogPage>): CatalogPage {
  if (state.status !== 'success') {
    throw new Error(`Esperava sucesso, veio ${state.status}.`)
  }
  return state.data
}

async function loadPage(params: CatalogParams) {
  const requests = recordRequests()
  const { result } = renderHook(() => useProducts(params))
  await waitFor(() => {
    expect(result.current.status).not.toBe('loading')
  })
  return { page: dataOf(result.current), requests }
}

describe('useProducts', () => {
  it('sem filtros, pede a página da lista ao servidor', async () => {
    const { page, requests } = await loadPage({
      query: '',
      category: undefined,
      page: 1,
    })

    expect(await summarizeRequest(requests[0])).toMatchObject({
      path: '/products',
      params: { limit: '12', skip: '0', select: SUMMARY_SELECT },
    })
    expect(page).toMatchObject({
      total: 194,
      page: 1,
      pageCount: 17,
      mode: 'all',
    })
    expect(page.products).toHaveLength(2)
  })

  it('calcula o skip da página pedida', async () => {
    const { requests } = await loadPage({
      query: '',
      category: undefined,
      page: 3,
    })

    const { params } = await summarizeRequest(requests[0])
    expect(params).toMatchObject({ limit: '12', skip: '24' })
  })

  it('com busca, pagina no servidor', async () => {
    const { page, requests } = await loadPage({
      query: 'phone',
      category: undefined,
      page: 2,
    })

    expect(await summarizeRequest(requests[0])).toMatchObject({
      path: '/products/search',
      params: { q: 'phone', limit: '12', skip: '12' },
    })
    expect(page).toMatchObject({ total: 23, pageCount: 2, mode: 'search' })
    expect(page.products).toHaveLength(11)
  })

  it('com categoria, usa a rota da categoria', async () => {
    const { page, requests } = await loadPage({
      query: '',
      category: 'smartphones',
      page: 1,
    })

    expect(await summarizeRequest(requests[0])).toMatchObject({
      path: '/products/category/smartphones',
      params: { limit: '12', skip: '0' },
    })
    expect(page).toMatchObject({ total: 16, pageCount: 2, mode: 'category' })
  })

  it('com busca e categoria, traz a busca toda e filtra e pagina no cliente', async () => {
    const { page, requests } = await loadPage({
      query: 'phone',
      category: 'smartphones',
      page: 1,
    })

    expect(await summarizeRequest(requests[0])).toMatchObject({
      path: '/products/search',
      params: { q: 'phone', limit: '0', skip: '0', select: SUMMARY_SELECT },
    })
    expect(page).toMatchObject({ total: 16, pageCount: 2, mode: 'combined' })
    expect(page.products).toHaveLength(12)
    expect(
      page.products.every((product) => product.category === 'smartphones'),
    ).toBe(true)
  })

  it('no modo combinado, a segunda página traz o restante', async () => {
    const { page } = await loadPage({
      query: 'phone',
      category: 'smartphones',
      page: 2,
    })

    expect(page.products.map((product) => product.id)).toEqual([
      133, 134, 135, 136,
    ])
  })

  it('no modo combinado sem resultados, não há páginas', async () => {
    const { page } = await loadPage({
      query: 'phone',
      category: 'laptops',
      page: 1,
    })

    expect(page).toMatchObject({ products: [], total: 0, pageCount: 0 })
  })

  it('expõe a falha do servidor como AppError', async () => {
    server.use(
      http.get(`${API_URL}/products`, () =>
        HttpResponse.json({ message: 'falhou' }, { status: 500 }),
      ),
    )
    const { result } = renderHook(() =>
      useProducts({ query: '', category: undefined, page: 1 }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current).toMatchObject({ error: { kind: 'server' } })
  })

  it('ao mudar de página, mantém a anterior enquanto carrega a próxima', async () => {
    const { result, rerender } = renderHook(
      (params: CatalogParams) => useProducts(params),
      { initialProps: { query: 'phone', category: undefined, page: 1 } },
    )
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    rerender({ query: 'phone', category: undefined, page: 2 })

    expect(result.current).toMatchObject({
      status: 'loading',
      previousData: { page: 1 },
    })
    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'success',
        data: { page: 2 },
      })
    })
  })
})
