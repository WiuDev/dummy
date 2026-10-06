import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { StockBadge } from './StockBadge'

describe('StockBadge', () => {
  it.each([
    [99, 'In Stock', 'Em estoque'],
    [3, 'Low Stock', 'Estoque baixo'],
    [0, 'Out of Stock', 'Esgotado'],
  ])(
    'com estoque %s e status %j mostra %j',
    (stock, availabilityStatus, label) => {
      renderWithProviders(
        <StockBadge stock={stock} availabilityStatus={availabilityStatus} />,
      )

      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )

  it('decide pelo estoque quando o status é desconhecido', () => {
    renderWithProviders(<StockBadge stock={0} availabilityStatus="Unknown" />)

    expect(screen.getByText('Esgotado')).toBeInTheDocument()
  })
})
