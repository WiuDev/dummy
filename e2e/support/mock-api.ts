import type { Page, Route } from '@playwright/test'
import {
  type CheckoutRequest,
  checkoutRequestSchema,
} from '../../src/schemas/cart.ts'
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

function requestLabel(route: Route): string {
  return `${route.request().method()} ${route.request().url()}`
}

function isTestAccount(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'username' in body &&
    'password' in body &&
    body.username === 'emilys' &&
    body.password === 'emilyspass'
  )
}

const roundToCents = (value: number) => Math.round(value * 100) / 100

// Como a API: monta o carrinho com os produtos que conhece (os das fixtures),
// descarta os outros sem avisar e arredonda para inteiro o valor com desconto
// de cada linha.
function cartFromOrder(order: CheckoutRequest) {
  const products = order.products.flatMap(({ id, quantity }) => {
    const product = findProduct(id)
    if (product === undefined) {
      return []
    }
    const total = roundToCents(product.price * quantity)
    return [
      {
        id,
        title: product.title,
        price: product.price,
        quantity,
        total,
        discountPercentage: product.discountPercentage,
        discountedPrice: Math.round(
          total * (1 - product.discountPercentage / 100),
        ),
        thumbnail: product.thumbnail,
      },
    ]
  })
  return {
    id: 209,
    products,
    total: roundToCents(products.reduce((sum, line) => sum + line.total, 0)),
    discountedTotal: products.reduce(
      (sum, line) => sum + line.discountedPrice,
      0,
    ),
    userId: order.userId,
    totalProducts: products.length,
    totalQuantity: products.reduce((sum, line) => sum + line.quantity, 0),
  }
}

// POST da DummyJSON (D61). O login aceita a conta pública de teste e responde
// com a fixture, cujo token é sintético e vence em 2100 (D26); as outras
// credenciais recebem 400. O checkout exige o Bearer desse token.
function handlePost(route: Route, unhandled: string[]): Promise<void> {
  const request = route.request()
  const { pathname } = new URL(request.url())
  const body: unknown = request.postDataJSON()

  if (pathname === '/auth/login') {
    return isTestAccount(body)
      ? fulfillJson(route, fixtures.login)
      : fulfillJson(route, { message: 'Invalid credentials' }, 400)
  }
  if (pathname === '/auth/carts/add') {
    if (
      request.headers()['authorization'] !==
      `Bearer ${fixtures.login.accessToken}`
    ) {
      return fulfillJson(route, { message: 'Access Token is required' }, 401)
    }
    const order = checkoutRequestSchema.safeParse(body)
    return order.success
      ? fulfillJson(route, cartFromOrder(order.data), 201)
      : fulfillJson(route, { message: 'Invalid cart' }, 400)
  }

  unhandled.push(requestLabel(route))
  return fulfillJson(route, { message: `Rota não mockada: ${pathname}` }, 404)
}

// Responde como a DummyJSON. Rota ou método sem mock entra em unhandled (e
// responde 404 ou 405), para a fixture falhar o teste.
function handleApi(route: Route, unhandled: string[]): Promise<void> {
  const request = route.request()
  const url = new URL(request.url())
  const { pathname } = url

  if (request.method() === 'POST') {
    return handlePost(route, unhandled)
  }
  if (request.method() !== 'GET') {
    unhandled.push(requestLabel(route))
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

  unhandled.push(requestLabel(route))
  return fulfillJson(route, { message: `Rota não mockada: ${pathname}` }, 404)
}

// Instala a API falsa na página: DummyJSON e imagens do CDN respondidas daqui e
// qualquer outro host externo bloqueado, para o E2E do CI não sair para a rede.
// Devolve a lista, preenchida durante o teste, das requisições externas sem
// mock.
export async function installMockApi(page: Page): Promise<readonly string[]> {
  const unhandled: string[] = []

  // A rota registrada por último tem prioridade: o bloqueio geral vem antes.
  await page.route(/^https?:\/\/(?!localhost[:/])/, (route) => {
    unhandled.push(requestLabel(route))
    return route.abort('blockedbyclient')
  })
  await page.route('https://cdn.dummyjson.com/**', (route) =>
    route.fulfill({
      body: TRANSPARENT_PIXEL,
      contentType: 'image/png',
      headers: CORS_HEADERS,
    }),
  )
  await page.route(`${API_URL}/**`, (route) => handleApi(route, unhandled))

  return unhandled
}
