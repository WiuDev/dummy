import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

beforeEach(() => {
  document.title = 'Loja Dummy'
})

describe('useDocumentTitle', () => {
  it('define o título da página com o nome da loja', () => {
    renderHook(() => {
      useDocumentTitle('Produtos')
    })

    expect(document.title).toBe('Produtos · Loja Dummy')
  })

  it('acompanha a mudança de título', () => {
    const { rerender } = renderHook(
      ({ title }) => {
        useDocumentTitle(title)
      },
      { initialProps: { title: 'Produtos' } },
    )

    rerender({ title: 'iPhone 13 Pro' })

    expect(document.title).toBe('iPhone 13 Pro · Loja Dummy')
  })

  it('restaura o título anterior ao desmontar', () => {
    const { unmount } = renderHook(() => {
      useDocumentTitle('Produtos')
    })

    unmount()

    expect(document.title).toBe('Loja Dummy')
  })
})
