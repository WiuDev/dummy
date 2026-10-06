import { useEffect, useState } from 'react'

// Devolve o valor só depois de delayMs sem mudanças (ex.: a busca enquanto o
// usuário digita). Cada mudança reinicia a espera; o cleanup cancela o timer.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
