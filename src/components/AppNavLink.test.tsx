import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { AppNavLink } from './AppNavLink'

function StateDisplay() {
  const location = useLocation()
  return (
    <output aria-label="State atual">{JSON.stringify(location.state)}</output>
  )
}

describe('AppNavLink', () => {
  it('marca só o link da rota atual com aria-current="page"', () => {
    renderWithProviders(
      <nav>
        <AppNavLink to="/produtos">Produtos</AppNavLink>
        <AppNavLink to="/carrinho">Carrinho</AppNavLink>
      </nav>,
      { route: '/produtos' },
    )

    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Carrinho' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('continua ativo nas rotas filhas, a menos que receba end', () => {
    renderWithProviders(
      <nav>
        <AppNavLink to="/produtos">Seção</AppNavLink>
        <AppNavLink to="/produtos" end>
          Lista
        </AppNavLink>
      </nav>,
      { route: '/produtos/1' },
    )

    expect(screen.getByRole('link', { name: 'Seção' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Lista' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('navega e chama onClick ao ser clicado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderWithProviders(
      <AppNavLink to="/carrinho" onClick={onClick}>
        Carrinho
      </AppNavLink>,
      { route: '/produtos' },
    )

    await user.click(screen.getByRole('link', { name: 'Carrinho' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Carrinho' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('leva o state na navegação, quando informado', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <AppNavLink to="/login" state={{ from: '/produtos' }}>
          Entrar
        </AppNavLink>
        <StateDisplay />
      </>,
      { route: '/produtos' },
    )

    await user.click(screen.getByRole('link', { name: 'Entrar' }))

    expect(screen.getByLabelText('State atual')).toHaveTextContent(
      '{"from":"/produtos"}',
    )
  })

  it('usa o aria-label como nome acessível, quando informado', () => {
    renderWithProviders(
      <AppNavLink to="/carrinho" aria-label="Carrinho, 2 itens">
        Carrinho 2
      </AppNavLink>,
    )

    expect(
      screen.getByRole('link', { name: 'Carrinho, 2 itens' }),
    ).toHaveTextContent('Carrinho 2')
  })
})
