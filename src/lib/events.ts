export type Listener<T> = (payload: T) => void

export interface EventChannel<T> {
  readonly emit: (payload: T) => void
  readonly subscribe: (listener: Listener<T>) => () => void
}

// Canal de eventos tipado e síncrono. subscribe devolve a função que cancela a
// inscrição, pronta para ser o cleanup de um useEffect.
export function createEventChannel<T>(): EventChannel<T> {
  const listeners = new Set<Listener<T>>()

  return {
    emit: (payload) => {
      // Itera sobre uma cópia: inscrições feitas ou canceladas durante o emit
      // só valem a partir do próximo.
      for (const listener of [...listeners]) {
        listener(payload)
      }
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
