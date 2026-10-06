import { http, HttpResponse, type RequestHandler } from 'msw'
import { type CheckoutRequest, checkoutRequestSchema } from '@/schemas/cart'
import categories from '@/test/fixtures/categories.json'
import accessTokenRequired from '@/test/fixtures/error-access-token-required.json'
import invalidCredentials from '@/test/fixtures/error-invalid-credentials.json'
import notFound from '@/test/fixtures/error-not-found.json'
import login from '@/test/fixtures/login.json'
import me from '@/test/fixtures/me.json'
import product1 from '@/test/fixtures/product-1.json'
import productAdd from '@/test/fixtures/product-add.json'
import productDelete from '@/test/fixtures/product-delete.json'
import productUpdate from '@/test/fixtures/product-update.json'
import smartphones from '@/test/fixtures/products-category-smartphones.json'
import productsPage from '@/test/fixtures/products-page.json'
import searchPhone from '@/test/fixtures/products-search-phone.json'

// Mesmo valor do baseURL de src/services/api.ts (um teste confere).
export const API_URL = 'https://dummyjson.com'

interface FixturePage {
  readonly products: readonly unknown[]
  readonly total: number
}

// Busca ou categoria sem fixture: a API responde 200 com a página vazia.
const EMPTY_PAGE: FixturePage = { products: [], total: 0 }

// Responde como a API: fatia os produtos com limit e skip (o padrão é 30 e
// limit=0 traz todos) e informa em limit quantos itens vieram.
function paginate(page: FixturePage, request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') ?? 30)
  const skip = Number(searchParams.get('skip') ?? 0)
  const products = page.products.slice(
    skip,
    limit === 0 ? undefined : skip + limit,
  )
  return { products, total: page.total, skip, limit: products.length }
}

// Só a busca "phone" tem fixture: as 23 respostas da API real.
function searchResults(request: Request): FixturePage {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  return query?.toLowerCase() === 'phone' ? searchPhone : EMPTY_PAGE
}

interface KnownProduct {
  readonly id: number
  readonly title: string
  readonly price: number
  readonly discountPercentage: number
  readonly thumbnail: string
}

// Os produtos que a API "conhece" no checkout: os das fixtures.
const knownProducts = new Map<number, KnownProduct>(
  [
    product1,
    ...productsPage.products,
    ...searchPhone.products,
    ...smartphones.products,
  ].map((product) => [product.id, product] as const),
)

const roundToCents = (value: number) => Math.round(value * 100) / 100

// Como a API: monta o carrinho com os produtos que conhece, descarta os outros
// sem avisar e arredonda para inteiro o valor com desconto de cada linha. Com o
// pedido da fixture cart-add.json, a resposta é igual a ela.
function cartFromOrder(order: CheckoutRequest) {
  const products = order.products.flatMap(({ id, quantity }) => {
    const product = knownProducts.get(id)
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

export function hasBearer(request: Request): boolean {
  return request.headers.get('Authorization')?.startsWith('Bearer ') === true
}

export function requireBearer(request: Request): Response | undefined {
  return hasBearer(request)
    ? undefined
    : HttpResponse.json(accessTokenRequired, { status: 401 })
}

// Leitura de produtos. As rotas de admin (/auth/products) têm o mesmo contrato
// das públicas, mas exigem o Bearer. /search vem antes de /:id, que também
// casaria com ela.
function productReadHandlers(
  prefix: '/products' | '/auth/products',
): RequestHandler[] {
  const guard = (request: Request): Response | undefined =>
    prefix === '/auth/products' ? requireBearer(request) : undefined

  return [
    http.get(
      `${API_URL}${prefix}`,
      ({ request }) =>
        guard(request) ?? HttpResponse.json(paginate(productsPage, request)),
    ),
    http.get(
      `${API_URL}${prefix}/search`,
      ({ request }) =>
        guard(request) ??
        HttpResponse.json(paginate(searchResults(request), request)),
    ),
    http.get(
      `${API_URL}${prefix}/category/:slug`,
      ({ request, params }) =>
        guard(request) ??
        HttpResponse.json(
          paginate(
            params['slug'] === 'smartphones' ? smartphones : EMPTY_PAGE,
            request,
          ),
        ),
    ),
    http.get(
      `${API_URL}${prefix}/:id`,
      ({ request, params }) =>
        guard(request) ??
        (params['id'] === '1'
          ? HttpResponse.json(product1)
          : HttpResponse.json(notFound, { status: 404 })),
    ),
  ]
}

// Handlers padrão (caminho feliz) dos endpoints da DummyJSON. Só o produto 1
// existe; os demais ids dão 404, como na API. Cada teste pode sobrescrevê-los
// com server.use(...).
export const handlers: RequestHandler[] = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body: unknown = await request.json()
    const valid =
      typeof body === 'object' &&
      body !== null &&
      'username' in body &&
      'password' in body &&
      body.username === 'emilys' &&
      body.password === 'emilyspass'

    return valid
      ? HttpResponse.json(login)
      : HttpResponse.json(invalidCredentials, { status: 400 })
  }),

  http.get(
    `${API_URL}/auth/me`,
    ({ request }) => requireBearer(request) ?? HttpResponse.json(me),
  ),

  // Antes de /products/:id, que também casaria com "categories".
  http.get(`${API_URL}/products/categories`, () =>
    HttpResponse.json(categories),
  ),
  ...productReadHandlers('/products'),
  ...productReadHandlers('/auth/products'),

  http.post(
    `${API_URL}/auth/products/add`,
    ({ request }) =>
      requireBearer(request) ?? HttpResponse.json(productAdd, { status: 201 }),
  ),
  http.put(
    `${API_URL}/auth/products/:id`,
    ({ request, params }) =>
      requireBearer(request) ??
      (params['id'] === '1'
        ? HttpResponse.json(productUpdate)
        : HttpResponse.json(notFound, { status: 404 })),
  ),
  http.delete(
    `${API_URL}/auth/products/:id`,
    ({ request, params }) =>
      requireBearer(request) ??
      (params['id'] === '1'
        ? HttpResponse.json(productDelete)
        : HttpResponse.json(notFound, { status: 404 })),
  ),

  http.post(`${API_URL}/auth/carts/add`, async ({ request }) => {
    const denied = requireBearer(request)
    if (denied !== undefined) {
      return denied
    }
    const order = checkoutRequestSchema.safeParse(await request.json())
    return order.success
      ? HttpResponse.json(cartFromOrder(order.data), { status: 201 })
      : HttpResponse.json({ message: 'Invalid cart' }, { status: 400 })
  }),
]
