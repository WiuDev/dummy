import { http, HttpResponse, type RequestHandler } from 'msw'
import cartAdd from '@/test/fixtures/cart-add.json'
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

// Categoria que não existe: a API responde 200 com a página vazia.
const EMPTY_PAGE = { products: [], total: 0, skip: 0, limit: 0 }

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
      ({ request }) => guard(request) ?? HttpResponse.json(productsPage),
    ),
    http.get(
      `${API_URL}${prefix}/search`,
      ({ request }) => guard(request) ?? HttpResponse.json(searchPhone),
    ),
    http.get(
      `${API_URL}${prefix}/category/:slug`,
      ({ request, params }) =>
        guard(request) ??
        HttpResponse.json(
          params['slug'] === 'smartphones' ? smartphones : EMPTY_PAGE,
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

  http.post(
    `${API_URL}/auth/carts/add`,
    ({ request }) =>
      requireBearer(request) ?? HttpResponse.json(cartAdd, { status: 201 }),
  ),
]
