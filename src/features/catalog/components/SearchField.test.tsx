import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { SEARCH_DEBOUNCE_MS, SearchField } from './SearchField'

// Sem rede, o debounce é controlado com fake timers. O fireEvent é síncrono: o
// user-event depende de um setTimeout do Testing Library que, com os fake
// timers do Vitest, nunca dispara. As interações com user-event ficam nos
// testes da página, com timers reais.
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setup(value = '') {
  const onSearch = vi.fn()
  const view = renderWithProviders(
    <SearchField value={value} onSearch={onSearch} />,
  )
  const input = screen.getByRole('searchbox', { name: 'Buscar produtos' })
  const type = (text: string) => {
    fireEvent.change(input, { target: { value: text } })
  }
  return { onSearch, input, type, view }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('SearchField', () => {
  it('busca uma única vez, 400 ms depois da última mudança', () => {
    const { onSearch, type } = setup()

    type('p')
    advance(200)
    type('ph')
    advance(200)
    type('phone')
    advance(SEARCH_DEBOUNCE_MS - 1)
    expect(onSearch).not.toHaveBeenCalled()

    advance(1)
    expect(onSearch).toHaveBeenCalledOnce()
    expect(onSearch).toHaveBeenCalledWith('phone')
  })

  it('não busca de novo o que já está na URL', () => {
    const { onSearch, input, type } = setup('phone')
    expect(input).toHaveValue('phone')

    type('phone ')
    advance(SEARCH_DEBOUNCE_MS)

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('limpar o campo busca a string vazia', () => {
    const { onSearch, type } = setup('phone')

    type('')
    advance(SEARCH_DEBOUNCE_MS)

    expect(onSearch).toHaveBeenCalledWith('')
  })

  it('acompanha a busca que muda por fora, sem regravá-la', () => {
    const { onSearch, input, view } = setup('phone')

    view.rerender(<SearchField value="tablet" onSearch={onSearch} />)
    expect(input).toHaveValue('tablet')
    advance(SEARCH_DEBOUNCE_MS)

    expect(onSearch).not.toHaveBeenCalled()
  })
})
