import { http, HttpResponse, type RequestHandler } from 'msw'
import accessTokenRequired from '@/test/fixtures/error-access-token-required.json'
import invalidCredentials from '@/test/fixtures/error-invalid-credentials.json'
import notFound from '@/test/fixtures/error-not-found.json'
import login from '@/test/fixtures/login.json'
import me from '@/test/fixtures/me.json'
import product1 from '@/test/fixtures/product-1.json'

// Mesmo valor do baseURL de src/services/api.ts (um teste confere).
export const API_URL = 'https://dummyjson.com'

export function hasBearer(request: Request): boolean {
  return request.headers.get('Authorization')?.startsWith('Bearer ') === true
}

export function requireBearer(request: Request): Response | undefined {
  return hasBearer(request)
    ? undefined
    : HttpResponse.json(accessTokenRequired, { status: 401 })
}

// Handlers padrão (caminho feliz) dos endpoints da DummyJSON. Cada teste pode
// sobrescrevê-los com server.use(...).
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

  http.get(`${API_URL}/products/:id`, ({ params }) =>
    params['id'] === '1'
      ? HttpResponse.json(product1)
      : HttpResponse.json(notFound, { status: 404 }),
  ),
]
