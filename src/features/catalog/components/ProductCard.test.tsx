import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { productSummarySchema } from '@/schemas/product'
import productsPageFixture from '@/test/fixtures/products-page.json'
import { renderWithProviders } from '@/test/render'
import { ProductCard } from './ProductCard'

const product = productSummarySchema.parse(productsPageFixture.products[0])

describe('ProductCard', () => {
  it('leva ao detalhe pelo título e mostra imagem, nota, preço e estoque', () => {
    renderWithProviders(<ProductCard product={product} />)

    expect(
      screen.getByRole('link', { name: 'Essence Mascara Lash Princess' }),
    ).toHaveAttribute('href', '/produtos/1')
    expect(
      screen.getByRole('img', { name: 'Essence Mascara Lash Princess' }),
    ).toHaveAttribute('src', product.thumbnail)
    expect(screen.getByText('2,6')).toHaveTextContent('Avaliação: 2,6')
    expect(screen.getByText('US$ 8,94')).toBeInTheDocument()
    expect(screen.getByText('Em estoque')).toBeInTheDocument()
    expect(screen.getByText('Essence')).toBeInTheDocument()
  })

  it('mostra a categoria quando o produto não tem marca', () => {
    renderWithProviders(
      <ProductCard product={{ ...product, brand: undefined }} />,
    )

    expect(screen.getByText('beauty')).toBeInTheDocument()
  })
})
