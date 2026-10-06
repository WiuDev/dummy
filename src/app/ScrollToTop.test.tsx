import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNavigate } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ScrollToTop } from './ScrollToTop'

// Botões que navegam como o app: abrir um produto, trocar a página do catálogo,
// mudar só a busca e voltar no histórico.
function Harness() {
  const navigate = useNavigate()

  return (
    <>
      <ScrollToTop searchParams={['pagina']} />
      <button type="button" onClick={() => void navigate('/produtos/1')}>
        Abrir produto
      </button>
      <button type="button" onClick={() => void navigate('/produtos?pagina=2')}>
        Página 2
      </button>
      <button
        type="button"
        onClick={() => void navigate('/produtos?pagina=2&q=phone')}
      >
        Buscar
      </button>
      <button type="button" onClick={() => void navigate(-1)}>
        Voltar
      </button>
    </>
  )
}

function setup(initialEntries: readonly string[]) {
  const scrollTo = vi.spyOn(window, 'scrollTo')
  const user = userEvent.setup()
  renderWithProviders(<Harness />, { initialEntries })
  return { scrollTo, user }
}

describe('ScrollToTop', () => {
  it('não rola ao abrir a primeira página', () => {
    const { scrollTo } = setup(['/produtos'])

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('volta ao topo quando o caminho muda', async () => {
    const { scrollTo, user } = setup(['/produtos'])

    await user.click(screen.getByRole('button', { name: 'Abrir produto' }))

    expect(scrollTo).toHaveBeenCalledOnce()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('volta ao topo quando a página do catálogo muda', async () => {
    const { scrollTo, user } = setup(['/produtos'])

    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    expect(scrollTo).toHaveBeenCalledOnce()
  })

  it('não rola quando só outro parâmetro muda', async () => {
    const { scrollTo, user } = setup(['/produtos?pagina=2'])

    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('no Voltar (navegação POP), deixa a rolagem com o navegador', async () => {
    const { scrollTo, user } = setup(['/produtos'])
    await user.click(screen.getByRole('button', { name: 'Abrir produto' }))
    scrollTo.mockClear()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
