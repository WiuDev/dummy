import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { AppRoutes } from './AppRoutes'

function renderRoute(route: string) {
  return renderWithProviders(<AppRoutes />, { route })
}

describe('AppRoutes', () => {
  it('redireciona a home para o catálogo, dentro do layout', async () => {
    renderRoute('/')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(
      await within(main).findByRole('list', { name: 'Produtos' }),
    ).toBeInTheDocument()
  })

  it('do catálogo, o card leva ao detalhe do produto', async () => {
    const user = userEvent.setup()
    renderRoute('/produtos')

    await user.click(
      await screen.findByRole('link', {
        name: 'Essence Mascara Lash Princess',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Essence Mascara Lash Princess',
      }),
    ).toBeInTheDocument()
  })

  it('abre o deep link de um produto dentro do layout', async () => {
    renderRoute('/produtos/1')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      await within(screen.getByRole('main')).findByRole('heading', {
        level: 1,
        name: 'Essence Mascara Lash Princess',
      }),
    ).toBeInTheDocument()
  })

  it('o link do cabeçalho leva ao carrinho, dentro do layout', async () => {
    const user = userEvent.setup()
    renderRoute('/produtos')

    await user.click(
      within(screen.getByRole('banner')).getByRole('link', {
        name: 'Carrinho',
      }),
    )

    expect(
      within(screen.getByRole('main')).getByRole('heading', {
        level: 1,
        name: 'Carrinho',
      }),
    ).toBeInTheDocument()
  })

  it('mostra a página não encontrada para rotas desconhecidas', async () => {
    const user = userEvent.setup()
    renderRoute('/rota-inexistente')

    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', {
        level: 1,
        name: 'Página não encontrada',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()

    await user.click(
      within(main).getByRole('link', { name: 'Ver os produtos' }),
    )

    expect(
      within(main).getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeInTheDocument()
  })
})
