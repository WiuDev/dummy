import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import categoriesFixture from '@/test/fixtures/categories.json'
import { recordRequests } from '@/test/msw/requests'
import { useCategories } from './useCategories'

describe('useCategories', () => {
  it('carrega as categorias uma vez, mesmo com novos renders', async () => {
    const requests = recordRequests()
    const { result, rerender } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    rerender()

    expect(result.current).toMatchObject({
      status: 'success',
      data: categoriesFixture,
    })
    expect(requests).toHaveLength(1)
  })
})
