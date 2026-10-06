import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('avisa que a página não existe e leva de volta ao catálogo', () => {
    renderWithProviders(<NotFoundPage />, { route: '/rota-inexistente' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver os produtos' }),
    ).toHaveAttribute('href', '/produtos')
    expect(document.title).toBe('Página não encontrada · Loja Dummy')
  })
})
