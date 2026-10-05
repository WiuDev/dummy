import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('mostra a página em construção com a rota atual', () => {
    render(
      <MemoryRouter initialEntries={['/produtos/1']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/produtos/1')).toBeInTheDocument()
  })
})
