import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, type AppErrorKind } from '@/lib/errors'
import { API_URL, hasBearer } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { seedActiveSession, seedExpiredSession } from '@/test/session'
import { api, isAuthenticatedEndpoint } from './api'
import {
  httpErrorEvents,
  type UnauthorizedEvent,
  unauthorizedEvents,
} from './http-events'

const errorEvents: AppError[] = []
const unauthorized: UnauthorizedEvent[] = []
const unsubscribers: (() => void)[] = []

beforeEach(() => {
  errorEvents.length = 0
  unauthorized.length = 0
  unsubscribers.push(
    httpErrorEvents.subscribe((error) => errorEvents.push(error)),
    unauthorizedEvents.subscribe((event) => unauthorized.push(event)),
  )
})

afterEach(() => {
  for (const unsubscribe of unsubscribers.splice(0)) unsubscribe()
})

async function captureError(request: Promise<unknown>): Promise<AppError> {
  try {
    await request
  } catch (error) {
    if (error instanceof AppError) return error
    throw error
  }
  throw new Error('A requisição deveria ter falhado.')
}

describe('configuração', () => {
  it('usa a DummyJSON como baseURL, igual aos handlers do MSW', () => {
    expect(api.defaults.baseURL).toBe('https://dummyjson.com')
    expect(api.defaults.baseURL).toBe(API_URL)
  })

  it('expira em 10 s e informa o tempo esgotado como ETIMEDOUT', () => {
    expect(api.defaults.timeout).toBe(10_000)
    expect(api.defaults.transitional?.clarifyTimeoutError).toBe(true)
  })

  it.each([
    ['/auth/me', true],
    ['/auth/products/1', true],
    ['/auth/carts/add', true],
    ['/auth/login', false],
    ['/products', false],
    ['/products/auth/1', false],
    [undefined, false],
  ])('isAuthenticatedEndpoint(%s) = %s', (url, expected) => {
    expect(isAuthenticatedEndpoint(url)).toBe(expected)
  })
})

describe('interceptor de request', () => {
  it('não envia o token para rotas públicas, mesmo com sessão', async () => {
    seedActiveSession()
    let authorization: string | null = 'não capturado'
    server.use(
      http.get(`${API_URL}/products/1`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({ id: 1 })
      }),
    )

    await api.get('/products/1')

    expect(authorization).toBeNull()
  })

  it('não envia o token para o login', async () => {
    seedActiveSession()
    let sentBearer = true
    server.use(
      http.post(`${API_URL}/auth/login`, ({ request }) => {
        sentBearer = hasBearer(request)
        return HttpResponse.json({})
      }),
    )

    await api.post('/auth/login', {})

    expect(sentBearer).toBe(false)
  })

  it('injeta o Bearer nas rotas /auth/* com sessão ativa', async () => {
    const session = seedActiveSession()
    let authorization: string | null = null
    server.use(
      http.get(`${API_URL}/auth/me`, ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )

    await api.get('/auth/me')

    expect(authorization).toBe(`Bearer ${session.accessToken}`)
  })

  it('sem sessão, rejeita localmente: não envia a requisição nem emite evento', async () => {
    const handler = vi.fn(() => HttpResponse.json({}))
    server.use(http.get(`${API_URL}/auth/me`, handler))

    const error = await captureError(api.get('/auth/me'))

    expect(error.kind).toBe('unauthorized')
    expect(error.message).toBe('Entre na sua conta para continuar.')
    expect(handler).not.toHaveBeenCalled()
    expect(unauthorized).toEqual([])
    expect(errorEvents).toEqual([])
  })

  it('com a sessão expirada, não envia a requisição, apaga a sessão e emite expired', async () => {
    seedExpiredSession()
    const handler = vi.fn(() => HttpResponse.json({}))
    server.use(http.get(`${API_URL}/auth/me`, handler))

    const error = await captureError(api.get('/auth/me'))

    expect(error.kind).toBe('unauthorized')
    expect(error.message).toBe('Sua sessão expirou. Entre novamente.')
    expect(handler).not.toHaveBeenCalled()
    expect(unauthorized).toEqual([{ reason: 'expired', url: '/auth/me' }])
    expect(window.localStorage.getItem('dummy:auth:v1')).toBeNull()
  })
})

describe('interceptor de response', () => {
  it('converte o 401 de rota autenticada e emite rejected', async () => {
    seedActiveSession()
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json(
          { message: 'Invalid/Expired Token!' },
          { status: 401 },
        ),
      ),
    )

    const error = await captureError(api.get('/auth/me'))

    expect(error.kind).toBe('unauthorized')
    expect(error.status).toBe(401)
    expect(error.serverMessage).toBe('Invalid/Expired Token!')
    expect(unauthorized).toEqual([{ reason: 'rejected', url: '/auth/me' }])
    expect(errorEvents).toEqual([])
  })

  it('converte a falha de rede e avisa a notificação global', async () => {
    server.use(http.get(`${API_URL}/products/1`, () => HttpResponse.error()))

    const error = await captureError(api.get('/products/1'))

    expect(error.kind).toBe('network')
    expect(error.message).toBe(
      'Não foi possível conectar. Verifique sua internet.',
    )
    expect(errorEvents).toEqual([error])
  })

  it('usa a mensagem de sem conexão quando o navegador está offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    server.use(http.get(`${API_URL}/products/1`, () => HttpResponse.error()))

    const error = await captureError(api.get('/products/1'))

    expect(error.kind).toBe('network')
    expect(error.message).toBe('Você está sem conexão com a internet.')
  })

  // O interceptor XHR do MSW só chama o send real do jsdom, que é onde o timer
  // do timeout é armado, quando nenhum handler responde: com delay('infinite')
  // o XHR nunca expira. Por isso este teste troca o transporte por um adapter
  // que rejeita como o adapter XHR do axios no ontimeout (code ETIMEDOUT, por
  // causa do clarifyTimeoutError conferido na configuração).
  it('converte o tempo esgotado e avisa a notificação global', async () => {
    const timeoutError = Object.assign(new Error('timeout of 50ms exceeded'), {
      isAxiosError: true,
      code: 'ETIMEDOUT',
    })

    const error = await captureError(
      api.get('/products/1', { adapter: () => Promise.reject(timeoutError) }),
    )

    expect(error.kind).toBe('timeout')
    expect(error.message).toBe(
      'O servidor demorou a responder. Tente novamente.',
    )
    expect(error.cause).toBe(timeoutError)
    expect(errorEvents).toEqual([error])
  })

  it.each<[number, AppErrorKind]>([
    [500, 'server'],
    [503, 'server'],
    [429, 'rate_limited'],
  ])(
    'converte o status %s em %s e avisa a notificação global',
    async (status, kind) => {
      server.use(
        http.get(`${API_URL}/products/1`, () =>
          HttpResponse.json({ message: 'falhou' }, { status }),
        ),
      )

      const error = await captureError(api.get('/products/1'))

      expect(error.kind).toBe(kind)
      expect(error.status).toBe(status)
      expect(errorEvents).toEqual([error])
    },
  )

  it.each<[number, AppErrorKind]>([
    [400, 'bad_request'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [422, 'bad_request'],
  ])(
    'converte o status %s em %s sem notificação global',
    async (status, kind) => {
      server.use(
        http.get(`${API_URL}/products/1`, () =>
          HttpResponse.json({ message: 'Mensagem da API' }, { status }),
        ),
      )

      const error = await captureError(api.get('/products/1'))

      expect(error.kind).toBe(kind)
      expect(error.serverMessage).toBe('Mensagem da API')
      expect(errorEvents).toEqual([])
      expect(unauthorized).toEqual([])
    },
  )

  it('não guarda mensagem do servidor quando o corpo não segue o contrato', async () => {
    server.use(
      http.get(`${API_URL}/products/1`, () =>
        HttpResponse.text('erro', { status: 400 }),
      ),
    )

    const error = await captureError(api.get('/products/1'))

    expect(error.kind).toBe('bad_request')
    expect(error.serverMessage).toBeUndefined()
  })

  it('converte o cancelamento sem emitir evento', async () => {
    server.use(
      http.get(`${API_URL}/products/1`, async () => {
        await delay(200)
        return HttpResponse.json({})
      }),
    )
    const controller = new AbortController()

    const request = api.get('/products/1', { signal: controller.signal })
    controller.abort()
    const error = await captureError(request)

    expect(error.kind).toBe('canceled')
    expect(errorEvents).toEqual([])
    expect(unauthorized).toEqual([])
  })
})
