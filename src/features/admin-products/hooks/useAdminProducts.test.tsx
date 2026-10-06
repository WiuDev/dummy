import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_OVERLAY_KEY,
  EMPTY_ADMIN_OVERLAY,
  readAdminOverlay,
  writeAdminOverlay,
} from '@/lib/admin-overlay'
import { lampFields, mascaraAdmin } from '@/test/admin'
import { AdminProductsProvider } from '../context/AdminProductsProvider'
import { useAdminProducts } from './useAdminProducts'

function renderAdmin() {
  return renderHook(() => useAdminProducts(), {
    wrapper: AdminProductsProvider,
  })
}

describe('useAdminProducts', () => {
  it('fora do AdminProductsProvider, lança um erro', () => {
    // O React registra no console o erro lançado durante a renderização.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAdminProducts())).toThrow(
      'useAdminProducts deve ser usado dentro de <AdminProductsProvider>.',
    )
  })

  it('começa com o overlay salvo na aba', () => {
    const saved = {
      ...EMPTY_ADMIN_OVERLAY,
      created: [{ ...lampFields, id: 10_000 }],
      nextLocalId: 10_001,
    }
    writeAdminOverlay(saved)

    const { result } = renderAdmin()

    expect(result.current.overlay).toEqual(saved)
  })

  it('registra as alterações, grava no sessionStorage e descarta tudo', () => {
    const { result } = renderAdmin()
    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()

    act(() => {
      result.current.recordCreated(lampFields)
    })
    act(() => {
      result.current.recordUpdated({ ...mascaraAdmin, price: 12.5 })
    })
    act(() => {
      result.current.recordDeleted({
        id: 2,
        title: 'Eyeshadow Palette with Mirror',
        description: 'Paleta',
      })
    })

    expect(readAdminOverlay()).toEqual({
      version: 1,
      created: [{ ...lampFields, id: 10_000 }],
      updated: { '1': { ...mascaraAdmin, price: 12.5 } },
      deleted: [
        {
          id: 2,
          title: 'Eyeshadow Palette with Mirror',
          description: 'Paleta',
        },
      ],
      nextLocalId: 10_001,
    })

    act(() => {
      result.current.discard()
    })

    expect(result.current.overlay).toEqual(EMPTY_ADMIN_OVERLAY)
    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()
  })

  it('guarda a busca e a página num objeto; a busca nova volta à página 1 (G2)', () => {
    const { result } = renderAdmin()

    act(() => {
      result.current.setQuery('phone')
    })
    act(() => {
      result.current.setPage(3)
    })
    expect(result.current.filters).toEqual({ query: 'phone', page: 3 })

    const sameFilters = result.current.filters
    act(() => {
      result.current.setQuery('phone')
    })
    expect(result.current.filters).toBe(sameFilters)

    act(() => {
      result.current.setQuery('laptop')
    })
    expect(result.current.filters).toEqual({ query: 'laptop', page: 1 })
  })

  it('mantém as ações estáveis entre os renders', () => {
    const { result } = renderAdmin()
    const {
      setQuery,
      setPage,
      recordCreated,
      recordUpdated,
      recordDeleted,
      discard,
    } = result.current

    act(() => {
      result.current.recordCreated(lampFields)
    })

    expect(result.current.setQuery).toBe(setQuery)
    expect(result.current.setPage).toBe(setPage)
    expect(result.current.recordCreated).toBe(recordCreated)
    expect(result.current.recordUpdated).toBe(recordUpdated)
    expect(result.current.recordDeleted).toBe(recordDeleted)
    expect(result.current.discard).toBe(discard)
  })
})
