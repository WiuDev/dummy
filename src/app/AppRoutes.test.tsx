import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { AppRoutes } from './AppRoutes'

function renderRoute(route: string) {
  return renderWithProviders(<AppRoutes />, { route })
}

describe('AppRoutes', () => {
  it('redireciona a home para /produtos dentro do layout', () => {
    renderRoute('/')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByText('/produtos'),
    ).toBeVisible()
  })

  it('abre o deep link de um produto dentro do layout', () => {
    renderRoute('/produtos/1')

    expect(
      within(screen.getByRole('main')).getByText('/produtos/1'),
    ).toBeVisible()
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

    expect(within(main).getByText('/produtos')).toBeVisible()
  })
})
