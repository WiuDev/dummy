import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UnderConstructionPage } from '@/routes/UnderConstructionPage'
import { renderWithProviders } from './render'

describe('renderWithProviders', () => {
  it('renderiza com Mantine e com o roteador na rota pedida', () => {
    renderWithProviders(<UnderConstructionPage />, { route: '/produtos/1' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/produtos/1')).toBeInTheDocument()
  })

  it('usa a raiz quando nenhuma rota é informada', () => {
    renderWithProviders(<UnderConstructionPage />)

    expect(screen.getByText('/')).toBeInTheDocument()
  })
})
