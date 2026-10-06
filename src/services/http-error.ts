import { isAxiosError, isCancel } from 'axios'
import { AppError, type AppErrorKind, isAppError } from '@/lib/errors'
import { apiErrorBodySchema } from '@/schemas/common'

function kindFromStatus(status: number): AppErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'bad_request'
}

function readServerMessage(data: unknown): string | undefined {
  const result = apiErrorBodySchema.safeParse(data)
  return result.success ? result.data.message : undefined
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

// Normaliza qualquer falha de requisição em um AppError, com mensagem amigável
// e sem expor detalhes do axios para a interface.
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }
  if (isCancel(error)) {
    return new AppError('canceled', undefined, { cause: error })
  }
  if (!isAxiosError<unknown>(error)) {
    return new AppError('unknown', undefined, { cause: error })
  }

  // Com transitional.clarifyTimeoutError, o tempo esgotado chega como ETIMEDOUT.
  if (error.code === 'ETIMEDOUT') {
    return new AppError('timeout', undefined, { cause: error })
  }

  const { response } = error
  if (response === undefined) {
    return new AppError(
      'network',
      isOffline() ? 'Você está sem conexão com a internet.' : undefined,
      { cause: error },
    )
  }

  const serverMessage = readServerMessage(response.data)
  return new AppError(kindFromStatus(response.status), undefined, {
    status: response.status,
    cause: error,
    ...(serverMessage === undefined ? {} : { serverMessage }),
  })
}
