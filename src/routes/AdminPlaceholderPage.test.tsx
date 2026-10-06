import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { AdminPlaceholderPage } from './AdminPlaceholderPage'

describe('AdminPlaceholderPage', () => {
  it('cumprimenta quem entrou e avisa que a gestão está em construção', () => {
    renderWithProviders(<AdminPlaceholderPage />, { session: activeSession() })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Área administrativa' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Olá, Emily.')).toBeInTheDocument()
    expect(
      screen.getByText('A gestão de produtos está em construção.'),
    ).toBeInTheDocument()
    expect(document.title).toBe('Área administrativa · Loja Dummy')
  })

  it('fora do RequireAuth, sem sessão, não cumprimenta ninguém', () => {
    renderWithProviders(<AdminPlaceholderPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Área administrativa' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^Olá/)).toBeNull()
  })
})
