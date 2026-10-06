import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('mostra o título, a descrição e as ações', () => {
    renderWithProviders(
      <EmptyState
        title="Nenhum produto encontrado"
        description="Tente outra busca."
      >
        <button type="button">Limpar filtros</button>
      </EmptyState>,
    )

    expect(
      screen.getByRole('heading', { name: 'Nenhum produto encontrado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tente outra busca.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Limpar filtros' }),
    ).toBeInTheDocument()
  })

  it('funciona só com o título', () => {
    renderWithProviders(<EmptyState title="Nada por aqui" />)

    expect(
      screen.getByRole('heading', { name: 'Nada por aqui' }),
    ).toBeInTheDocument()
  })
})
