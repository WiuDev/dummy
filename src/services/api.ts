import axios, { isAxiosError } from 'axios'
import { inspectSession } from '@/lib/auth-session'
import { AppError, type AppErrorKind } from '@/lib/errors'
import { toAppError } from './http-error'
import { httpErrorEvents, unauthorizedEvents } from './http-events'

// Opções comuns aos services.
export interface RequestOptions {
  // Cancela a requisição (ex.: no cleanup de um useEffect).
  readonly signal?: AbortSignal
}

// Rotas que exigem Bearer na DummyJSON. O login é a exceção: é ele que gera o
// token. As rotas públicas nunca recebem o token.
export function isAuthenticatedEndpoint(url: string | undefined): boolean {
  return url !== undefined && url.startsWith('/auth/') && url !== '/auth/login'
}

// Falhas exibidas globalmente pelo HttpErrorNotifier. As demais (400, 404,
// 401, cancelamento) ficam para quem fez a requisição tratar.
const GLOBAL_ERROR_KINDS: ReadonlySet<AppErrorKind> = new Set<AppErrorKind>([
  'network',
  'timeout',
  'server',
  'rate_limited',
])

export const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
  transitional: { clarifyTimeoutError: true },
})

// Injeta o Bearer nas rotas /auth/*. Sem sessão salva, a requisição nem sai
// (não há o que expirar); com a sessão vencida, ela também não sai e o evento
// avisa quem cuida da sessão.
api.interceptors.request.use((config) => {
  if (!isAuthenticatedEndpoint(config.url)) {
    return config
  }

  const lookup = inspectSession()
  if (lookup.status === 'absent') {
    throw new AppError('unauthorized', 'Entre na sua conta para continuar.')
  }
  if (lookup.status === 'expired') {
    unauthorizedEvents.emit({ reason: 'expired', url: config.url })
    throw new AppError('unauthorized')
  }

  config.headers.set('Authorization', `Bearer ${lookup.session.accessToken}`)
  return config
})

// Normaliza as falhas em AppError e avisa os interessados: 401 de rota
// autenticada vai para quem cuida da sessão; falhas de comunicação, para a
// notificação global.
api.interceptors.response.use(undefined, (error: unknown) => {
  const appError = toAppError(error)

  if (
    isAxiosError(error) &&
    error.response?.status === 401 &&
    isAuthenticatedEndpoint(error.config?.url)
  ) {
    unauthorizedEvents.emit({ reason: 'rejected', url: error.config?.url })
  } else if (GLOBAL_ERROR_KINDS.has(appError.kind)) {
    httpErrorEvents.emit(appError)
  }

  throw appError
})
