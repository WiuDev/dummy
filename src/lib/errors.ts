export type AppErrorKind =
  | 'canceled'
  | 'network'
  | 'timeout'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'server'
  | 'invalid_response'
  | 'unknown'

export interface AppErrorOptions {
  readonly status?: number
  readonly serverMessage?: string
  readonly cause?: unknown
}

// Mensagens amigáveis exibidas ao usuário quando não há uma mais específica.
export const APP_ERROR_MESSAGES: Readonly<Record<AppErrorKind, string>> = {
  canceled: 'A operação foi cancelada.',
  network: 'Não foi possível conectar. Verifique sua internet.',
  timeout: 'O servidor demorou a responder. Tente novamente.',
  bad_request: 'Não foi possível concluir a solicitação.',
  unauthorized: 'Sua sessão expirou. Entre novamente.',
  forbidden: 'Você não tem permissão para esta ação.',
  not_found: 'O item solicitado não foi encontrado.',
  rate_limited: 'Muitas requisições em pouco tempo. Tente em instantes.',
  server: 'Erro no servidor. Tente novamente.',
  invalid_response: 'Resposta inesperada do servidor.',
  unknown: 'Ocorreu um erro inesperado.',
}

export class AppError extends Error {
  override readonly name = 'AppError'
  readonly kind: AppErrorKind
  readonly status: number | undefined
  readonly serverMessage: string | undefined

  constructor(
    kind: AppErrorKind,
    message?: string,
    options: AppErrorOptions = {},
  ) {
    super(message ?? APP_ERROR_MESSAGES[kind], { cause: options.cause })
    this.kind = kind
    this.status = options.status
    this.serverMessage = options.serverMessage
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}

// Garante um AppError para qualquer falha (erros desconhecidos viram 'unknown').
export function asAppError(error: unknown): AppError {
  return isAppError(error)
    ? error
    : new AppError('unknown', undefined, { cause: error })
}
