import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { readCartItems } from '@/lib/cart-storage'
import type { CartItem } from '@/schemas/cart'
import { mascaraItem, paletteItem } from '@/test/cart'
import { renderWithProviders } from '@/test/render'
import { CartPage } from './CartPage'

function renderCart(cartItems: readonly CartItem[]) {
  return renderWithProviders(
    <Routes>
      <Route path="/carrinho" element={<CartPage />} />
      <Route path="/produtos" element={<p>Catálogo</p>} />
    </Routes>,
    { route: '/carrinho', cartItems },
  )
}

const summary = () => screen.getByRole('region', { name: 'Resumo' })
const quantityOf = (title: string) =>
  screen.getByRole('textbox', { name: `Quantidade de ${title}` })

// Rímel: 8,94 com desconto (9,99 cheio); paleta: 16,35 (19,99 cheio).
describe('CartPage', () => {
  it('vazio, convida a voltar ao catálogo', async () => {
    const user = userEvent.setup()
    renderCart([])

    expect(
      screen.getByRole('heading', { level: 1, name: 'Carrinho' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Seu carrinho está vazio',
      }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Carrinho · Loja Dummy')

    await user.click(screen.getByRole('link', { name: 'Ver os produtos' }))

    expect(screen.getByText('Catálogo')).toBeInTheDocument()
  })

  it('lista os itens com o total de cada linha e o resumo em centavos', () => {
    renderCart([{ ...mascaraItem, quantity: 2 }, paletteItem])

    const items = within(
      screen.getByRole('list', { name: 'Itens do carrinho' }),
    ).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(screen.getByText('3 itens')).toBeInTheDocument()

    const [mascaraRow, paletteRow] = items
    expect(mascaraRow).toHaveTextContent('Total do item: US$ 17,88')
    expect(paletteRow).toHaveTextContent('Total do item: US$ 16,35')
    expect(
      screen.getByRole('link', { name: 'Essence Mascara Lash Princess' }),
    ).toHaveAttribute('href', '/produtos/1')
    expect(quantityOf('Essence Mascara Lash Princess')).toHaveValue('2')

    expect(summary()).toHaveTextContent('SubtotalUS$ 39,97')
    expect(summary()).toHaveTextContent('Descontos-US$ 5,74')
    expect(summary()).toHaveTextContent('TotalUS$ 34,23')
  })

  it('trocar a quantidade atualiza a linha, os totais e o carrinho salvo', async () => {
    const user = userEvent.setup()
    renderCart([{ ...mascaraItem, quantity: 2 }, paletteItem])

    await user.clear(quantityOf('Essence Mascara Lash Princess'))
    await user.type(quantityOf('Essence Mascara Lash Princess'), '3')

    expect(screen.getByText('4 itens')).toBeInTheDocument()
    expect(summary()).toHaveTextContent('TotalUS$ 43,17')
    expect(readCartItems()).toEqual([
      { ...mascaraItem, quantity: 3 },
      paletteItem,
    ])
  })

  it('apagar o número não muda o carrinho e, ao sair do campo, ele volta', async () => {
    const user = userEvent.setup()
    renderCart([{ ...mascaraItem, quantity: 2 }])

    await user.clear(quantityOf('Essence Mascara Lash Princess'))
    expect(screen.getByText('2 itens')).toBeInTheDocument()

    await user.tab()

    expect(quantityOf('Essence Mascara Lash Princess')).toHaveValue('2')
  })

  it('a quantidade não passa do estoque', async () => {
    const user = userEvent.setup()
    renderCart([paletteItem])

    // Estoque de 34: o campo recusa o 0 que faria 50.
    await user.clear(quantityOf('Eyeshadow Palette with Mirror'))
    await user.type(quantityOf('Eyeshadow Palette with Mirror'), '50')

    expect(quantityOf('Eyeshadow Palette with Mirror')).toHaveValue('5')
    expect(readCartItems()).toEqual([{ ...paletteItem, quantity: 5 }])
  })

  it('remove itens até o carrinho ficar vazio', async () => {
    const user = userEvent.setup()
    renderCart([mascaraItem, paletteItem])

    await user.click(
      screen.getByRole('button', {
        name: 'Remover Eyeshadow Palette with Mirror do carrinho',
      }),
    )

    expect(
      within(
        screen.getByRole('list', { name: 'Itens do carrinho' }),
      ).getAllByRole('listitem'),
    ).toHaveLength(1)
    expect(summary()).toHaveTextContent('TotalUS$ 8,94')

    await user.click(
      screen.getByRole('button', {
        name: 'Remover Essence Mascara Lash Princess do carrinho',
      }),
    )

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Seu carrinho está vazio',
      }),
    ).toBeInTheDocument()
    expect(readCartItems()).toEqual([])
  })
})
