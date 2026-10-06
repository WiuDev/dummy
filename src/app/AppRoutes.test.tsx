import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
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

  it('o /admin exige login e, depois de entrar, volta para ele', async () => {
    const user = userEvent.setup()
    renderRoute('/admin')

    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Entrar' }),
    ).toBeInTheDocument()

    await user.type(
      within(main).getByRole('textbox', { name: 'Usuário' }),
      'emilys',
    )
    await user.type(within(main).getByLabelText('Senha'), 'emilyspass')
    await user.click(within(main).getByRole('button', { name: 'Entrar' }))

    // O /admin leva à gestão de produtos, que chega num chunk próprio.
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Gestão de produtos',
      }),
    ).toBeInTheDocument()
  })

  it('logado, o /admin abre a gestão de produtos no layout do admin', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/admin',
      session: activeSession(),
    })

    expect(
      await screen.findByRole('table', { name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegação do admin' }),
    ).toBeInTheDocument()
  })

  it('uma rota desconhecida do admin mostra a página não encontrada no layout do admin', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/admin/qualquer-coisa',
      session: activeSession(),
    })

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Página não encontrada',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegação do admin' }),
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
