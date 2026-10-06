import { act, renderHook } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Product } from '@/schemas/product'
import { getProduct } from '@/services/products.service'
import product1Fixture from '@/test/fixtures/product-1.json'
import { API_URL } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { type ActionResult, useAsyncAction } from './useAsyncAction'

function loadProduct(signal: AbortSignal, id: number): Promise<Product> {
  return getProduct(id, { signal })
}

function productHandler(delays: Readonly<Record<string, number | 'infinite'>>) {
  return http.get(`${API_URL}/products/:id`, async ({ params }) => {
    const id = String(params['id'])
    await delay(delays[id] ?? 0)
    return HttpResponse.json({ ...product1Fixture, id: Number(id) })
  })
}

describe('useAsyncAction', () => {
  it('passa de pending a success e devolve os dados', async () => {
    const { result } = renderHook(() => useAsyncAction(loadProduct))
    expect(result.current.state).toEqual({ status: 'idle' })
    const runs: Promise<ActionResult<Product>>[] = []

    act(() => {
      runs.push(result.current.run(1))
    })

    expect(result.current.state).toEqual({ status: 'pending' })
    const [outcome] = await act(() => Promise.all(runs))
    expect(outcome).toMatchObject({ ok: true, data: { id: 1 } })
    expect(result.current.state).toMatchObject({
      status: 'success',
      data: { id: 1 },
    })
  })

  it('devolve a falha como AppError, no resultado e no estado', async () => {
    const { result } = renderHook(() => useAsyncAction(loadProduct))

    const outcome = await act(() => result.current.run(9999))

    expect(outcome).toMatchObject({ ok: false, error: { kind: 'not_found' } })
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { kind: 'not_found' },
    })
  })

  it('nunca rejeita: erros inesperados viram AppError unknown', async () => {
    const original = new TypeError('falhou')
    const failing = (): Promise<never> => Promise.reject(original)
    const { result } = renderHook(() => useAsyncAction(failing))

    const outcome = await act(() => result.current.run())

    expect(outcome).toMatchObject({
      ok: false,
      error: { kind: 'unknown', cause: original },
    })
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { kind: 'unknown' },
    })
  })

  it('uma nova chamada aborta a anterior, que termina como canceled sem mexer no estado', async () => {
    server.use(productHandler({ '1': 50, '2': 150 }))
    const signals: AbortSignal[] = []
    // Ignora o signal de propósito: a resposta da primeira chamada chega, e o
    // hook precisa descartá-la.
    const action = (signal: AbortSignal, id: number): Promise<Product> => {
      signals.push(signal)
      return getProduct(id)
    }
    const { result } = renderHook(() => useAsyncAction(action))
    const runs: Promise<ActionResult<Product>>[] = []

    act(() => {
      runs.push(result.current.run(1), result.current.run(2))
    })
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])

    const first = await act(() => runs[0])
    expect(first).toMatchObject({ ok: false, error: { kind: 'canceled' } })
    expect(result.current.state).toEqual({ status: 'pending' })

    const second = await act(() => runs[1])
    expect(second).toMatchObject({ ok: true, data: { id: 2 } })
    expect(result.current.state).toMatchObject({
      status: 'success',
      data: { id: 2 },
    })
  })

  it('aborta a execução ao desmontar', async () => {
    server.use(productHandler({ '1': 'infinite' }))
    const signals: AbortSignal[] = []
    const action = (signal: AbortSignal, id: number): Promise<Product> => {
      signals.push(signal)
      return getProduct(id, { signal })
    }
    const { result, unmount } = renderHook(() => useAsyncAction(action))
    const runs: Promise<ActionResult<Product>>[] = []
    act(() => {
      runs.push(result.current.run(1))
    })

    unmount()

    expect(signals.map((signal) => signal.aborted)).toEqual([true])
    const [outcome] = await Promise.all(runs)
    expect(outcome).toMatchObject({ ok: false, error: { kind: 'canceled' } })
  })

  it('reset aborta a execução em curso e volta ao estado ocioso', async () => {
    server.use(productHandler({ '1': 'infinite' }))
    const { result } = renderHook(() => useAsyncAction(loadProduct))
    const runs: Promise<ActionResult<Product>>[] = []
    act(() => {
      runs.push(result.current.run(1))
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toEqual({ status: 'idle' })
    const [outcome] = await act(() => Promise.all(runs))
    expect(outcome).toMatchObject({ ok: false, error: { kind: 'canceled' } })
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
