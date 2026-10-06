import type { Page, Route } from '@playwright/test'
import type { Product, ProductSummary } from '../../src/schemas/product.ts'
import { fixtures } from './fixtures.ts'

const API_URL = 'https://dummyjson.com'

// O spike da Fase 3 mostrou que, no Playwright 1.63, o navegador aceita a
// resposta mockada mesmo sem cabeçalho CORS; ele fica para reproduzir a API
// real e não depender desse comportamento (D44). O preflight (OPTIONS) é
// respondido pelo próprio Playwright.
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' }

// PNG transparente de 1×1: as imagens do CDN não saem para a rede.
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

interface PageFixture {
  readonly products: readonly ProductSummary[]
  readonly total: number
}

const EMPTY_PAGE: PageFixture = { products: [], total: 0 }

// Como a API: fatia por limit e skip (o padrão é 30; limit=0 traz tudo) e
// informa em limit quantos itens vieram.
function paginate(page: PageFixture, url: URL) {
  const limit = Number(url.searchParams.get('limit') ?? 30)
  const skip = Number(url.searchParams.get('skip') ?? 0)
  const products = page.products.slice(
    skip,
    limit === 0 ? undefined : skip + limit,
  )
  return { products, total: page.total, skip, limit: products.length }
}

// Só a busca "phone" e a categoria "smartphones" têm dados; o resto vem vazio.
function searchResults(url: URL): PageFixture {
  const query = url.searchParams.get('q')?.trim().toLowerCase()
  return query === 'phone' ? fixtures.searchPhone : EMPTY_PAGE
}

function categoryResults(slug: string): PageFixture {
  return slug === 'smartphones' ? fixtures.smartphones : EMPTY_PAGE
}

// Detalhe de qualquer produto das fixtures: o produto 1 como modelo, com o
// resumo do produto pedido por cima. Os demais ids dão 404, como na API.
function findProduct(id: number): Product | undefined {
  if (id === fixtures.product1.id) {
    return fixtures.product1
  }
  const summary = [
    ...fixtures.productsPage.products,
    ...fixtures.searchPhone.products,
    ...fixtures.smartphones.products,
  ].find((product) => product.id === id)
  return summary === undefined
    ? undefined
    : { ...fixtures.product1, ...summary }
}

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, json: body, headers: CORS_HEADERS })
}

function handleApi(route: Route): Promise<void> {
  const request = route.request()
  const url = new URL(request.url())
  const { pathname } = url

  if (request.method() !== 'GET') {
    return fulfillJson(
      route,
      { message: `Método não mockado: ${request.method()}` },
      405,
    )
  }
  if (pathname === '/products/categories') {
    return fulfillJson(route, fixtures.categories)
  }
  if (pathname === '/products') {
    return fulfillJson(route, paginate(fixtures.productsPage, url))
  }
  if (pathname === '/products/search') {
    return fulfillJson(route, paginate(searchResults(url), url))
  }

  const category = /^\/products\/category\/([^/]+)$/.exec(pathname)
  if (category !== null) {
    return fulfillJson(route, paginate(categoryResults(category[1] ?? ''), url))
  }

  const productId = /^\/products\/(\d+)$/.exec(pathname)
  if (productId !== null) {
    const product = findProduct(Number(productId[1]))
    return product === undefined
      ? fulfillJson(
          route,
          { message: `Product with id '${productId[1] ?? ''}' not found` },
          404,
        )
      : fulfillJson(route, product)
  }

  return fulfillJson(route, { message: `Rota não mockada: ${pathname}` }, 404)
}

// Instala a API falsa na página: DummyJSON e imagens do CDN respondidas daqui e
// qualquer outro host externo bloqueado, para o E2E do CI não sair para a rede.
export async function installMockApi(page: Page): Promise<void> {
  // A rota registrada por último tem prioridade: o bloqueio geral vem antes.
  await page.route(/^https?:\/\/(?!localhost[:/])/, (route) =>
    route.abort('blockedbyclient'),
  )
  await page.route('https://cdn.dummyjson.com/**', (route) =>
    route.fulfill({
      body: TRANSPARENT_PIXEL,
      contentType: 'image/png',
      headers: CORS_HEADERS,
    }),
  )
  await page.route(`${API_URL}/**`, handleApi)
}
