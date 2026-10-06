import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { recordRequests } from '@/test/msw/requests'
import { useProduct } from './useProduct'

describe('useProduct', () => {
  it('com id null fica ocioso e não faz requisição', () => {
    const requests = recordRequests()

    const { result } = renderHook(() => useProduct(null))

    expect(result.current.status).toBe('idle')
    expect(requests).toEqual([])
  })

  it('carrega o produto pelo id', async () => {
    const { result } = renderHook(() => useProduct(1))

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current).toMatchObject({
      data: { id: 1, title: 'Essence Mascara Lash Princess' },
    })
  })

  it('informa produto inexistente como not_found', async () => {
    const { result } = renderHook(() => useProduct(9999))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current).toMatchObject({ error: { kind: 'not_found' } })
  })

  it('carrega quando o id passa a ser válido', async () => {
    const initialProps: { readonly id: number | null } = { id: null }
    const { result, rerender } = renderHook(({ id }) => useProduct(id), {
      initialProps,
    })
    expect(result.current.status).toBe('idle')

    rerender({ id: 1 })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
  })
})
