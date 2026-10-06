import { act, renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Product } from '@/schemas/product'
import { getProduct } from '@/services/products.service'
import product1Fixture from '@/test/fixtures/product-1.json'
import { API_URL } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { type AsyncTask, useAsync } from './useAsync'

// Responde qualquer id com uma cópia do produto 1; delays define atrasos por id.
function productHandler(delays: Readonly<Record<string, number>> = {}) {
  return http.get(`${API_URL}/products/:id`, async ({ params }) => {
    const id = String(params['id'])
    await delay(delays[id] ?? 0)
    return HttpResponse.json({
      ...product1Fixture,
      id: Number(id),
      title: `Produto ${id}`,
    })
  })
}

// Tarefa que carrega o produto e guarda o signal recebido.
function loadProduct(
  id: number,
  signals: AbortSignal[] = [],
): AsyncTask<Product> {
  return (signal) => {
    signals.push(signal)
    return getProduct(id, { signal })
  }
}

describe('useAsync', () => {
  it('fica ocioso sem tarefa', () => {
    const { result } = renderHook(() => useAsync(null))

    expect(result.current.status).toBe('idle')
  })

  it('carrega e expõe os dados', async () => {
    const task = loadProduct(1)
    const { result } = renderHook(() => useAsync(task))

    expect(result.current).toMatchObject({
      status: 'loading',
      previousData: undefined,
    })
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current).toMatchObject({ data: { id: 1 } })
  })

  it('expõe a falha como AppError', async () => {
    const task = loadProduct(9999)
    const { result } = renderHook(() => useAsync(task))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current).toMatchObject({
      error: { kind: 'not_found' },
      previousData: undefined,
    })
  })

  it('aborta a execução ao desmontar', () => {
    server.use(
      http.get(`${API_URL}/products/1`, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    const signals: AbortSignal[] = []
    const task = loadProduct(1, signals)
    const { unmount } = renderHook(() => useAsync(task))

    expect(signals.map((signal) => signal.aborted)).toEqual([false])
    unmount()
    expect(signals.map((signal) => signal.aborted)).toEqual([true])
  })

  it('ao trocar de tarefa, aborta a anterior e ignora a resposta atrasada', async () => {
    server.use(productHandler({ '1': 100 }))
    const signals: AbortSignal[] = []
    // A primeira tarefa ignora o signal, como uma tarefa sem suporte a
    // cancelamento: a resposta dela chega, mas não pode ser usada.
    const first: AsyncTask<Product> = (signal) => {
      signals.push(signal)
      return getProduct(1)
    }
    const second = loadProduct(2, signals)
    const { result, rerender } = renderHook(({ task }) => useAsync(task), {
      initialProps: { task: first },
    })

    rerender({ task: second })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current).toMatchObject({ data: { id: 2 } })
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])

    await act(() => delay(150))
    expect(result.current).toMatchObject({
      status: 'success',
      data: { id: 2 },
    })
  })

  it('mantém os dados anteriores enquanto carrega a próxima tarefa', async () => {
    server.use(productHandler())
    const { result, rerender } = renderHook(({ task }) => useAsync(task), {
      initialProps: { task: loadProduct(1) },
    })
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    rerender({ task: loadProduct(2) })

    expect(result.current).toMatchObject({
      status: 'loading',
      previousData: { id: 1 },
    })
    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'success',
        data: { id: 2 },
      })
    })
  })

  it('reload executa de novo e, se falhar, mantém os dados anteriores', async () => {
    const task = loadProduct(1)
    const { result } = renderHook(() => useAsync(task))
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    const { reload } = result.current
    server.use(
      http.get(`${API_URL}/products/1`, () =>
        HttpResponse.json({ message: 'falhou' }, { status: 500 }),
      ),
    )

    act(() => {
      reload()
    })

    expect(result.current).toMatchObject({
      status: 'loading',
      previousData: { id: 1 },
    })
    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current).toMatchObject({
      error: { kind: 'server' },
      previousData: { id: 1 },
    })
    expect(result.current.reload).toBe(reload)
  })
})
