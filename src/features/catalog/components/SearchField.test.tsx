import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { SEARCH_DEBOUNCE_MS, SearchField } from './SearchField'

// Sem rede, o debounce é controlado com fake timers. O primeiro bloco usa
// fireEvent, síncrono, com controle exato do relógio. O user-event também
// funciona com os fake timers do Vitest (último bloco): shouldAdvanceTime faz o
// relógio andar com o tempo real e dispara o setTimeout(0) que o Testing
// Library espera depois de cada interação (sem ele, o teste trava), e
// advanceTimers deixa o user-event adiantar o relógio nas próprias pausas.
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
  beforeEach(() => {
    vi.useFakeTimers()
  })

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

describe('SearchField com user-event e fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  it('digitar busca uma única vez, depois do debounce', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onSearch, input } = setup()

    await user.type(input, 'phone')
    advance(SEARCH_DEBOUNCE_MS)

    expect(input).toHaveValue('phone')
    expect(onSearch).toHaveBeenCalledOnce()
    expect(onSearch).toHaveBeenCalledWith('phone')
  })
})
