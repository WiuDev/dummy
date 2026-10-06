import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ProductGallery } from './ProductGallery'

const IMAGES = [
  'https://cdn.dummyjson.com/produto/1.webp',
  'https://cdn.dummyjson.com/produto/2.webp',
  'https://cdn.dummyjson.com/produto/3.webp',
]

describe('ProductGallery', () => {
  it('mostra a primeira imagem e troca pela miniatura escolhida', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductGallery images={IMAGES} title="iPhone 13" />)

    expect(screen.getByRole('img', { name: 'iPhone 13' })).toHaveAttribute(
      'src',
      IMAGES[0],
    )
    expect(
      screen.getByRole('button', { name: 'Imagem 1 de 3' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Imagem 3 de 3' }))

    expect(screen.getByRole('img', { name: 'iPhone 13' })).toHaveAttribute(
      'src',
      IMAGES[2],
    )
    expect(
      screen.getByRole('button', { name: 'Imagem 3 de 3' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Imagem 1 de 3' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('com uma imagem só, não mostra miniaturas', () => {
    renderWithProviders(
      <ProductGallery images={IMAGES.slice(0, 1)} title="iPhone 13" />,
    )

    expect(screen.getByRole('img', { name: 'iPhone 13' })).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Imagens do produto' }),
    ).toBeNull()
  })
})
