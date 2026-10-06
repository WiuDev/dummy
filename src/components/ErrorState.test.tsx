import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '@/lib/errors'
import { renderWithProviders } from '@/test/render'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('mostra a mensagem do AppError e tenta de novo ao clicar', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderWithProviders(
      <ErrorState error={new AppError('server')} onRetry={onRetry} />,
    )

    const alert = screen.getByRole('alert')
    expect(
      within(alert).getByText('Não foi possível carregar'),
    ).toBeInTheDocument()
    expect(
      within(alert).getByText('Erro no servidor. Tente novamente.'),
    ).toBeInTheDocument()

    await user.click(
      within(alert).getByRole('button', { name: 'Tentar novamente' }),
    )

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
