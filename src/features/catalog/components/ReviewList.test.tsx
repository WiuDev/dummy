import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productSchema } from '@/schemas/product'
import product1Fixture from '@/test/fixtures/product-1.json'
import { renderWithProviders } from '@/test/render'
import { ReviewList } from './ReviewList'

const { reviews } = productSchema.parse(product1Fixture)

describe('ReviewList', () => {
  it('mostra autor, data em pt-BR, nota e comentário de cada avaliação', () => {
    renderWithProviders(<ReviewList reviews={reviews} />)

    const list = screen.getByRole('list', { name: 'Avaliações de clientes' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.textContent)).toEqual([
      'Eleanor Collins30 de abril de 2025Nota 3 de 5Would not recommend!',
      'Lucas Gordon30 de abril de 2025Nota 4 de 5Very satisfied!',
      'Eleanor Collins30 de abril de 2025Nota 5 de 5Highly impressed!',
    ])
    expect(within(list).getAllByText('30 de abril de 2025')[0]).toHaveAttribute(
      'dateTime',
      '2025-04-30T09:41:02.053Z',
    )
  })

  it('avisa quando ainda não há avaliações', () => {
    renderWithProviders(<ReviewList reviews={[]} />)

    expect(
      screen.getByText('Este produto ainda não tem avaliações.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
