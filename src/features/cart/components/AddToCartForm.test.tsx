import { notifications } from '@mantine/notifications'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { readCartItems } from '@/lib/cart-storage'
import { mascaraItem, mascaraProduct } from '@/test/cart'
import { renderWithProviders } from '@/test/render'
import { AddToCartForm } from './AddToCartForm'

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

const quantityInput = () => screen.getByRole('textbox', { name: 'Quantidade' })
const addButton = () =>
  screen.getByRole('button', { name: 'Adicionar ao carrinho' })

describe('AddToCartForm', () => {
  it('adiciona a quantidade escolhida e confirma com uma notificação', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddToCartForm product={mascaraProduct} />)

    await user.clear(quantityInput())
    await user.type(quantityInput(), '3')
    await user.click(addButton())

    expect(
      await screen.findByText('3 unidades de Essence Mascara Lash Princess.'),
    ).toBeInTheDocument()
    expect(readCartItems()).toEqual([{ ...mascaraItem, quantity: 3 }])
    expect(screen.getByText(/^3 unidades no carrinho\./)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver o carrinho' }),
    ).toHaveAttribute('href', '/carrinho')
    expect(quantityInput()).toHaveValue('1')
  })

  it('não passa do estoque, descontado o que já está no carrinho', async () => {
    const user = userEvent.setup()
    const product = { ...mascaraProduct, stock: 3 }
    renderWithProviders(<AddToCartForm product={product} />, {
      cartItems: [{ ...product, quantity: 2 }],
    })

    expect(screen.getByText(/^2 unidades no carrinho\./)).toBeInTheDocument()

    // Só resta uma unidade: o campo recusa um número maior.
    await user.clear(quantityInput())
    await user.type(quantityInput(), '5')
    expect(quantityInput()).toHaveValue('')
    expect(addButton()).toBeDisabled()

    await user.type(quantityInput(), '1')
    await user.click(addButton())

    expect(readCartItems()).toEqual([{ ...product, quantity: 3 }])
    expect(
      screen.getByText(/^Todas as unidades disponíveis já estão no carrinho\./),
    ).toBeInTheDocument()
    expect(quantityInput()).toBeDisabled()
    expect(addButton()).toBeDisabled()
  })

  it('produto esgotado não tem o que comprar', () => {
    renderWithProviders(
      <AddToCartForm product={{ ...mascaraProduct, stock: 0 }} />,
    )

    expect(
      screen.getByText('Produto esgotado: não há unidades para comprar.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Adicionar ao carrinho' }),
    ).toBeNull()
  })
})
