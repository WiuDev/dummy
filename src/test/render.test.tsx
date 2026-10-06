import { Title } from '@mantine/core'
import { screen } from '@testing-library/react'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from './render'

// Componente do Mantine que lê a rota: só renderiza com os dois providers.
function CurrentRoute() {
  const { pathname } = useLocation()
  return <Title order={1}>Rota {pathname}</Title>
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
})
