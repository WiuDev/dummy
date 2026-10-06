import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ProductGridSkeleton } from './ProductGridSkeleton'

describe('ProductGridSkeleton', () => {
  it('avisa que está carregando e desenha uma página de cards', () => {
    const { container } = renderWithProviders(<ProductGridSkeleton />)

    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument()
    expect(container.querySelectorAll('.mantine-Card-root')).toHaveLength(12)
  })

  it('aceita outra quantidade de cards', () => {
    const { container } = renderWithProviders(<ProductGridSkeleton count={4} />)

    expect(container.querySelectorAll('.mantine-Card-root')).toHaveLength(4)
  })
})
