import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { Price } from './Price'

// As consultas do Testing Library normalizam espaços: o espaço não separável
// que o Intl coloca depois de "US$" vira um espaço comum na comparação.
describe('Price', () => {
  it('mostra o preço com desconto, o preço cheio e o percentual', () => {
    renderWithProviders(<Price price={9.99} discountPercentage={10.48} />)

    // O getByText compara só o texto do próprio elemento; o prefixo oculto
    // fica num span filho e entra no toHaveTextContent.
    expect(screen.getByText('US$ 8,94')).toHaveTextContent(
      'Preço com desconto: US$ 8,94',
    )
    const original = screen.getByText('US$ 9,99')
    expect(original).toHaveTextContent('Preço original: US$ 9,99')
    expect(original).toHaveStyle({ textDecoration: 'line-through' })
    expect(screen.getByText('-10%')).toBeInTheDocument()
  })

  it('sem desconto, mostra só o preço', () => {
    renderWithProviders(<Price price={19.99} size="xl" />)

    expect(screen.getByText('US$ 19,99')).toBeInTheDocument()
    expect(screen.queryByText(/Preço original/)).not.toBeInTheDocument()
  })
})
