import { Title } from '@mantine/core'
import { screen } from '@testing-library/react'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useAuth } from '@/features/auth'
import { useCart } from '@/features/cart'
import { mascaraItem, paletteItem } from './cart'
import { renderWithProviders } from './render'
import { activeSession } from './session'

// Componente do Mantine que lê a rota: só renderiza com os dois providers.
function CurrentRoute() {
  const { pathname } = useLocation()
  return <Title order={1}>Rota {pathname}</Title>
}

function CartCount() {
  const { totals } = useCart()
  return <p>{totals.itemCount} no carrinho</p>
}

function CurrentUser() {
  const { user } = useAuth()
  return <p>{user === null ? 'Visitante' : `Logado como ${user.firstName}`}</p>
}

describe('renderWithProviders', () => {
  it('renderiza com Mantine e com o roteador na rota pedida', () => {
    renderWithProviders(<CurrentRoute />, { route: '/produtos/1' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rota /produtos/1' }),
    ).toBeInTheDocument()
  })

  it('usa a raiz quando nenhuma rota é informada', () => {
    renderWithProviders(<CurrentRoute />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rota /' }),
    ).toBeInTheDocument()
  })

  it('com initialEntries, a última entrada é a rota atual', () => {
    renderWithProviders(<CurrentRoute />, {
      initialEntries: ['/produtos', '/produtos/1'],
    })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rota /produtos/1' }),
    ).toBeInTheDocument()
  })

  it('monta o carrinho com os itens semeados', () => {
    renderWithProviders(<CartCount />, {
      cartItems: [{ ...mascaraItem, quantity: 2 }, paletteItem],
    })

    expect(screen.getByText('3 no carrinho')).toBeInTheDocument()
  })

  it('sem itens semeados, o carrinho começa vazio', () => {
    renderWithProviders(<CartCount />)

    expect(screen.getByText('0 no carrinho')).toBeInTheDocument()
  })

  it('monta a autenticação com a sessão semeada, ou como visitante', () => {
    const { unmount } = renderWithProviders(<CurrentUser />, {
      session: activeSession(),
    })
    expect(screen.getByText('Logado como Emily')).toBeInTheDocument()
    unmount()
    window.localStorage.clear()

    renderWithProviders(<CurrentUser />)
    expect(screen.getByText('Visitante')).toBeInTheDocument()
  })
})
