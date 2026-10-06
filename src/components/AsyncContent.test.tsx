import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AsyncState } from '@/hooks/useAsync'
import { AppError } from '@/lib/errors'
import { renderWithProviders } from '@/test/render'
import { AsyncContent } from './AsyncContent'

interface Person {
  readonly name: string
}

function renderContent(state: AsyncState<Person>, onRetry = vi.fn()) {
  return renderWithProviders(
    <AsyncContent
      state={state}
      onRetry={onRetry}
      skeleton={<p>Carregando a lista</p>}
    >
      {(person) => <p>Olá, {person.name}</p>}
    </AsyncContent>,
  )
}

describe('AsyncContent', () => {
  it('não mostra nada enquanto não há tarefa', () => {
    renderContent({ status: 'idle' })

    expect(screen.queryByText('Carregando a lista')).not.toBeInTheDocument()
    expect(screen.queryByText(/Olá/)).not.toBeInTheDocument()
  })

  it('mostra o skeleton na primeira carga', () => {
    renderContent({ status: 'loading', previousData: undefined })

    expect(screen.getByText('Carregando a lista')).toBeInTheDocument()
    expect(screen.queryByText(/Olá/)).not.toBeInTheDocument()
  })

  it('ao recarregar, mantém os dados anteriores sob o overlay', () => {
    renderContent({ status: 'loading', previousData: { name: 'Ana' } })

    const content = screen.getByText('Olá, Ana')
    expect(content.closest('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText('Carregando a lista')).not.toBeInTheDocument()
  })

  it('mostra o ErrorState e tenta de novo', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderContent(
      {
        status: 'error',
        error: new AppError('network'),
        previousData: undefined,
      },
      onRetry,
    )

    expect(
      screen.getByText('Não foi possível conectar. Verifique sua internet.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('mostra os dados no sucesso', () => {
    renderContent({ status: 'success', data: { name: 'Bia' } })

    const content = screen.getByText('Olá, Bia')
    expect(content.closest('[aria-busy="true"]')).toBeNull()
  })
})
