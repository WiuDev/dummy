import { notifications } from '@mantine/notifications'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { readSession } from '@/lib/auth-session'
import { readCartItems } from '@/lib/cart-storage'
import { redirectTarget } from '@/lib/redirect'
import type { CartItem } from '@/schemas/cart'
import { mascaraItem, paletteItem } from '@/test/cart'
import { API_URL } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { CartPage } from './CartPage'

// No lugar do login: mostra para onde ele voltaria.
function LoginProbe() {
  const location = useLocation()
  return <p>Login, depois {redirectTarget(location.state)}</p>
}

function renderCart(
  cartItems: readonly CartItem[],
  { signedIn = false }: { readonly signedIn?: boolean } = {},
) {
  return renderWithProviders(
    <Routes>
      <Route path="/carrinho" element={<CartPage />} />
      <Route path="/produtos" element={<p>Catálogo</p>} />
      <Route path="/login" element={<LoginProbe />} />
    </Routes>,
    {
      route: '/carrinho',
      cartItems,
      ...(signedIn ? { session: activeSession() } : {}),
    },
  )
}

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

const checkoutButton = () =>
  screen.getByRole('button', { name: 'Finalizar compra' })

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
    await user.tab()

    expect(quantityOf('Essence Mascara Lash Princess')).toHaveValue('3')
    expect(screen.getByText('4 itens')).toBeInTheDocument()
    expect(summary()).toHaveTextContent('TotalUS$ 43,17')
    expect(readCartItems()).toEqual([
      { ...mascaraItem, quantity: 3 },
      paletteItem,
    ])
  })

  it('sem desconto, o resumo não mostra a linha de descontos', () => {
    renderCart([{ ...paletteItem, discountPercentage: 0 }])

    expect(summary()).toHaveTextContent('SubtotalUS$ 19,99')
    expect(summary()).not.toHaveTextContent('Descontos')
    expect(summary()).toHaveTextContent('TotalUS$ 19,99')
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

  it('remove itens até o carrinho ficar vazio, com o foco no vizinho e depois no título', async () => {
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
    // Era o último: o foco vai para o anterior.
    expect(
      screen.getByRole('link', { name: 'Essence Mascara Lash Princess' }),
    ).toHaveFocus()

    await user.keyboard('{Tab}{Tab}{Enter}')

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Seu carrinho está vazio',
      }),
    ).toBeInTheDocument()
    expect(readCartItems()).toEqual([])
    expect(
      screen.getByRole('heading', { level: 1, name: 'Carrinho' }),
    ).toHaveFocus()
  })

  it('remover um item leva o foco ao item seguinte', async () => {
    const user = userEvent.setup()
    renderCart([mascaraItem, paletteItem])

    await user.click(
      screen.getByRole('button', {
        name: 'Remover Essence Mascara Lash Princess do carrinho',
      }),
    )

    expect(
      screen.getByRole('link', { name: 'Eyeshadow Palette with Mirror' }),
    ).toHaveFocus()
    expect(readCartItems()).toEqual([paletteItem])
  })
})

describe('CartPage: finalizar a compra', () => {
  const ITEMS = [{ ...mascaraItem, quantity: 2 }, paletteItem]

  it('sem login, leva ao login, que volta para o carrinho', async () => {
    const user = userEvent.setup()
    renderCart(ITEMS)

    expect(
      screen.getByText(
        'Para finalizar, entre na sua conta. O carrinho continua aqui.',
      ),
    ).toBeInTheDocument()
    await user.click(checkoutButton())

    expect(screen.getByText('Login, depois /carrinho')).toBeInTheDocument()
    expect(readCartItems()).toEqual(ITEMS)
  })

  it('com login, confirma o pedido e esvazia o carrinho', async () => {
    const user = userEvent.setup()
    renderCart(ITEMS, { signedIn: true })

    await user.click(checkoutButton())

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Pedido confirmado',
    })
    expect(heading).toHaveFocus()
    expect(
      screen.getByText('Pedido nº 209: 3 itens, total de US$ 34,23.'),
    ).toBeInTheDocument()
    expect(readCartItems()).toEqual([])

    await user.click(screen.getByRole('link', { name: 'Continuar comprando' }))

    expect(screen.getByText('Catálogo')).toBeInTheDocument()
  })

  it('durante o envio, o carrinho não muda', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_URL}/auth/carts/add`, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    renderCart(ITEMS, { signedIn: true })

    await user.click(checkoutButton())

    expect(checkoutButton()).toHaveAttribute('data-loading', 'true')
    expect(quantityOf('Essence Mascara Lash Princess')).toBeDisabled()
    expect(
      screen.getByRole('button', {
        name: 'Remover Essence Mascara Lash Princess do carrinho',
      }),
    ).toBeDisabled()
  })

  it('na falha, avisa e mantém o carrinho para tentar de novo', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        `${API_URL}/auth/carts/add`,
        () => HttpResponse.json({ message: 'falhou' }, { status: 500 }),
        { once: true },
      ),
    )
    renderCart(ITEMS, { signedIn: true })

    await user.click(checkoutButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível finalizar a compraErro no servidor. Tente novamente.',
    )
    expect(readCartItems()).toEqual(ITEMS)

    await user.click(checkoutButton())

    expect(
      await screen.findByRole('heading', { name: 'Pedido confirmado' }),
    ).toBeInTheDocument()
  })

  it('quando a API descarta produtos, avisa e mantém o carrinho', async () => {
    const user = userEvent.setup()
    const items = [mascaraItem, { ...paletteItem, id: 9999 }]
    renderCart(items, { signedIn: true })

    await user.click(checkoutButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Alguns produtos do carrinho não estão mais disponíveis. Revise o carrinho e tente de novo.',
    )
    expect(readCartItems()).toEqual(items)
  })

  it('com a sessão recusada (401), avisa e o botão volta a levar ao login', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_URL}/auth/carts/add`, () =>
        HttpResponse.json({ message: 'invalid signature' }, { status: 401 }),
      ),
    )
    renderCart(ITEMS, { signedIn: true })

    await user.click(checkoutButton())

    expect(
      await screen.findByText('Sua sessão expirou. Entre novamente.'),
    ).toBeInTheDocument()
    expect(readSession()).toBeNull()
    expect(readCartItems()).toEqual(ITEMS)

    await user.click(checkoutButton())

    expect(screen.getByText('Login, depois /carrinho')).toBeInTheDocument()
  })
})
