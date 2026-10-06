import { z } from 'zod'
import { AppError } from '@/lib/errors'

// Valida o corpo da resposta com o schema. Se a API mudar o contrato, a falha
// vira um AppError 'invalid_response' em vez de dados corrompidos na tela.
export function parseResponse<S extends z.ZodType>(
  schema: S,
  data: unknown,
  source: string,
): z.output<S> {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }

  if (import.meta.env.MODE === 'development') {
    console.error(
      `Resposta inválida de ${source}:\n${z.prettifyError(result.error)}`,
    )
  }
  throw new AppError('invalid_response', undefined, { cause: result.error })
}
