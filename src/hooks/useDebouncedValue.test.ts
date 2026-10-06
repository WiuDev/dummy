import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderDebounced(initial: string) {
  return renderHook(({ value }) => useDebouncedValue(value, 300), {
    initialProps: { value: initial },
  })
}

describe('useDebouncedValue', () => {
  it('só atualiza depois do intervalo sem mudanças', () => {
    const { result, rerender } = renderDebounced('a')

    rerender({ value: 'ab' })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('ab')
  })

  it('reinicia a espera a cada mudança', () => {
    const { result, rerender } = renderDebounced('a')

    rerender({ value: 'ab' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ value: 'abc' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('abc')
  })

  it('cancela o timer ao desmontar', () => {
    const { rerender, unmount } = renderDebounced('a')
    rerender({ value: 'ab' })
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
