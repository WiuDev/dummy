import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('mostra o título como h1, a descrição e as ações', () => {
    renderWithProviders(
      <PageHeader title="Produtos" description="194 produtos">
        <button type="button">Ação</button>
      </PageHeader>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(screen.getByText('194 produtos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument()
  })

  it('funciona só com o título', () => {
    renderWithProviders(<PageHeader title="Produtos" />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
