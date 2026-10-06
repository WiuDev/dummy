import { act, screen } from '@testing-library/react'
import { createRef } from 'react'
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

    const title = screen.getByRole('heading', { level: 1, name: 'Produtos' })
    expect(title).toBeInTheDocument()
    expect(title).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('com titleRef, o título aceita o foco, fora da tabulação', () => {
    const titleRef = createRef<HTMLHeadingElement>()
    renderWithProviders(<PageHeader title="Carrinho" titleRef={titleRef} />)

    act(() => {
      titleRef.current?.focus()
    })

    const title = screen.getByRole('heading', { level: 1, name: 'Carrinho' })
    expect(title).toHaveFocus()
    expect(title).toHaveAttribute('tabindex', '-1')
  })
})
