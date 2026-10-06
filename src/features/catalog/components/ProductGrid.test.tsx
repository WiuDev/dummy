import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productsPageSchema } from '@/schemas/product'
import searchPhoneFixture from '@/test/fixtures/products-search-phone.json'
import { renderWithProviders } from '@/test/render'
import { ProductGrid } from './ProductGrid'

const products = productsPageSchema
  .parse(searchPhoneFixture)
  .products.slice(0, 3)

describe('ProductGrid', () => {
  it('mostra um item de lista por produto, cada um com o link do detalhe', () => {
    renderWithProviders(<ProductGrid products={products} />)

    const list = screen.getByRole('list', { name: 'Produtos' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(products.map((product) => `/produtos/${product.id}`))
  })
})
