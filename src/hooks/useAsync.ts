import { useCallback, useEffect, useState } from 'react'
import { type AppError, asAppError } from '@/lib/errors'

// Tarefa cancelável. Passe uma referência estável (useCallback ou definida
// fora do componente): cada tarefa nova dispara uma nova execução.
export type AsyncTask<T> = (signal: AbortSignal) => Promise<T>

export type AsyncState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly previousData: T | undefined }
  | { readonly status: 'success'; readonly data: T }
  | {
      readonly status: 'error'
      readonly error: AppError
      readonly previousData: T | undefined
    }

export type UseAsyncResult<T> = AsyncState<T> & { readonly reload: () => void }

// Resultado de uma execução, marcado com a tarefa e a tentativa que o geraram.
// lastData guarda o último dado carregado, para a tela não piscar enquanto a
// próxima execução carrega ou quando ela falha.
interface Outcome<T> {
  readonly task: AsyncTask<T>
  readonly attempt: number
  readonly result:
    | { readonly status: 'success'; readonly data: T }
    | { readonly status: 'error'; readonly error: AppError }
  readonly lastData: T | undefined
}

function deriveState<T>(
  task: AsyncTask<T> | null,
  attempt: number,
  outcome: Outcome<T> | null,
): AsyncState<T> {
  if (task === null) {
    return { status: 'idle' }
  }
  // Enquanto não há resultado desta tarefa e desta tentativa, ela carrega.
  if (
    outcome === null ||
    outcome.task !== task ||
    outcome.attempt !== attempt
  ) {
    return { status: 'loading', previousData: outcome?.lastData }
  }
  return outcome.result.status === 'success'
    ? { status: 'success', data: outcome.result.data }
    : {
        status: 'error',
        error: outcome.result.error,
        previousData: outcome.lastData,
      }
}

// Executa a tarefa ao montar e sempre que ela mudar. O carregamento é derivado
// (não há setState síncrono no efeito), o cleanup aborta a execução em curso e
// resultados de execuções abortadas são descartados.
export function useAsync<T>(task: AsyncTask<T> | null): UseAsyncResult<T> {
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null)

  useEffect(() => {
    if (task === null) {
      return undefined
    }

    const controller = new AbortController()
    void task(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setOutcome({
            task,
            attempt,
            result: { status: 'success', data },
            lastData: data,
          })
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setOutcome((previous) => ({
            task,
            attempt,
            result: { status: 'error', error: asAppError(error) },
            lastData: previous?.lastData,
          }))
        }
      },
    )

    return () => {
      controller.abort()
    }
  }, [task, attempt])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  return { ...deriveState(task, attempt, outcome), reload }
}
