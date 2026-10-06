import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useCatalogParams } from './useCatalogParams'

// Devolve também a URL atual e o tipo da última navegação (PUSH ou REPLACE),
// para conferir como cada ação grava no histórico.
function renderCatalogParams(initialEntry: string) {
  return renderHook(
    () => ({
      catalog: useCatalogParams(),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      ),
    },
  )
}

describe('useCatalogParams', () => {
  it('lê busca, categoria e página da URL', () => {
    const { result } = renderCatalogParams(
      '/produtos?q=phone&categoria=smartphones&pagina=2',
    )

    expect(result.current.catalog.params).toEqual({
      query: 'phone',
      category: 'smartphones',
      page: 2,
    })
  })

  it('usa os padrões para parâmetros ausentes ou inválidos', () => {
    const { result } = renderCatalogParams(
      '/produtos?q=&categoria=N%C3%A3o%20V%C3%A1lida&pagina=abc',
    )

    expect(result.current.catalog.params).toEqual({
      query: '',
      category: undefined,
      page: 1,
    })
  })

  it('setQuery substitui a entrada do histórico e volta para a página 1', () => {
    const { result } = renderCatalogParams(
      '/produtos?categoria=smartphones&pagina=3',
    )

    act(() => {
      result.current.catalog.setQuery('  phone ')
    })

    expect(result.current.location.pathname).toBe('/produtos')
    expect(result.current.location.search).toBe(
      '?q=phone&categoria=smartphones',
    )
    expect(result.current.navigationType).toBe('REPLACE')
  })

  it('setQuery vazio tira a busca da URL', () => {
    const { result } = renderCatalogParams('/produtos?q=phone')

    act(() => {
      result.current.catalog.setQuery('')
    })

    expect(result.current.location.search).toBe('')
    expect(result.current.navigationType).toBe('REPLACE')
  })

  it('setCategory empilha a navegação e volta para a página 1', () => {
    const { result } = renderCatalogParams('/produtos?q=phone&pagina=2')

    act(() => {
      result.current.catalog.setCategory('smartphones')
    })

    expect(result.current.location.search).toBe(
      '?q=phone&categoria=smartphones',
    )
    expect(result.current.navigationType).toBe('PUSH')

    act(() => {
      result.current.catalog.setCategory(undefined)
    })

    expect(result.current.location.search).toBe('?q=phone')
  })

  it('setPage empilha a navegação e omite a página 1', () => {
    const { result } = renderCatalogParams('/produtos?q=phone')

    act(() => {
      result.current.catalog.setPage(2)
    })

    expect(result.current.location.search).toBe('?q=phone&pagina=2')
    expect(result.current.navigationType).toBe('PUSH')

    act(() => {
      result.current.catalog.setPage(1)
    })

    expect(result.current.location.search).toBe('?q=phone')
  })

  it('clearFilters volta para o catálogo sem filtros', () => {
    const { result } = renderCatalogParams(
      '/produtos?q=phone&categoria=smartphones&pagina=2',
    )

    act(() => {
      result.current.catalog.clearFilters()
    })

    expect(result.current.location.search).toBe('')
    expect(result.current.navigationType).toBe('PUSH')
  })

  it('searchFor monta a query string sem navegar', () => {
    const { result } = renderCatalogParams('/produtos?q=phone&pagina=3')
    const { searchFor } = result.current.catalog

    expect(searchFor({ page: 2 })).toBe('?q=phone&pagina=2')
    expect(searchFor({ query: '', page: 1 })).toBe('')
    expect(searchFor({})).toBe('?q=phone&pagina=3')
    expect(result.current.location.search).toBe('?q=phone&pagina=3')
  })

  it('devolve o mesmo resultado enquanto a URL não muda', () => {
    const { result, rerender } = renderCatalogParams('/produtos?q=phone')
    const first = result.current.catalog

    rerender()

    expect(result.current.catalog).toBe(first)
  })
})
