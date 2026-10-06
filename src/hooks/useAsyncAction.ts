import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, asAppError } from '@/lib/errors'

export type ActionResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: AppError }

export type AsyncActionState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'pending' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: AppError }

export interface UseAsyncActionResult<TArgs extends readonly unknown[], T> {
  readonly state: AsyncActionState<T>
  // Nunca rejeita: a falha vem no resultado e no estado.
  readonly run: (...args: TArgs) => Promise<ActionResult<T>>
  readonly reset: () => void
}

// Executa mutações (salvar, excluir, finalizar a compra) com estado explícito.
// Uma nova chamada de run aborta a anterior, que termina com 'canceled' sem
// mexer no estado. Desmontar o componente e chamar reset também abortam.
export function useAsyncAction<TArgs extends readonly unknown[], T>(
  action: (signal: AbortSignal, ...args: TArgs) => Promise<T>,
): UseAsyncActionResult<TArgs, T> {
  const [state, setState] = useState<AsyncActionState<T>>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      controllerRef.current?.abort()
    },
    [],
  )

  const run = useCallback(
    async (...args: TArgs): Promise<ActionResult<T>> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ status: 'pending' })

      let result: ActionResult<T>
      try {
        result = { ok: true, data: await action(controller.signal, ...args) }
      } catch (error) {
        result = { ok: false, error: asAppError(error) }
      }

      if (controller.signal.aborted) {
        return { ok: false, error: new AppError('canceled') }
      }
      controllerRef.current = null
      setState(
        result.ok
          ? { status: 'success', data: result.data }
          : { status: 'error', error: result.error },
      )
      return result
    },
    [action],
  )

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, run, reset }
}
