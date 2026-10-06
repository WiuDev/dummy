import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { readSession } from '@/lib/auth-session'
import { redirectTarget } from '@/lib/redirect'
import { RequireAuth } from '@/routes/RequireAuth'
import type { AuthSession } from '@/schemas/auth'
import type { CartItem } from '@/schemas/cart'
import { mascaraItem, paletteItem } from '@/test/cart'
import { LocationDisplay } from '@/test/location'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { PublicLayout } from './PublicLayout'

// No lugar do login: mostra para onde ele voltaria.
function LoginProbe() {
  const location = useLocation()
  return <p>Login, depois {redirectTarget(location.state)}</p>
}

function renderLayout(
  route = '/produtos',
  cartItems: readonly CartItem[] = [],
  session?: AuthSession,
) {
  return renderWithProviders(
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/produtos" element={<p>Lista de produtos</p>} />
          <Route path="/produtos/:id" element={<p>Detalhe do produto</p>} />
          <Route path="/carrinho" element={<p>Itens do carrinho</p>} />
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<p>Área administrativa</p>} />
          </Route>
        </Route>
      </Routes>
      <LocationDisplay />
    </>,
    { route, cartItems, ...(session === undefined ? {} : { session }) },
  )
}

const address = () => screen.getByLabelText('Endereço atual')

const headerNav = () =>
  within(screen.getByRole('banner')).getByRole('navigation', {
    name: 'Navegação principal',
  })

// O link compacto do carrinho, do cabeçalho do celular: o que fica fora da
// navegação de desktop (no jsdom, os dois aparecem juntos).
const compactCartLink = (name: string) =>
  within(screen.getByRole('banner'))
    .getAllByRole('link', { name })
    .find((link) => !headerNav().contains(link))

// No jsdom o CSS do Mantine não é aplicado, então a navegação de desktop e o
// Burger do mobile aparecem juntos; o Drawer só existe quando aberto.
describe('PublicLayout', () => {
  it('mostra o cabeçalho, a navegação e a página atual no Outlet', () => {
    renderLayout()

    const header = screen.getByRole('banner')
    expect(
      within(header).getByRole('link', { name: 'Loja Dummy' }),
    ).toHaveAttribute('href', '/produtos')
    const nav = within(header).getByRole('navigation', {
      name: 'Navegação principal',
    })
    expect(within(nav).getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('main')).toHaveTextContent('Lista de produtos')
  })

  it('mantém Produtos ativo no detalhe de um produto', () => {
    renderLayout('/produtos/1')

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(nav).getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('main')).toHaveTextContent('Detalhe do produto')
  })

  it('oferece o link para pular para o conteúdo', () => {
    renderLayout()

    expect(
      screen.getByRole('link', { name: 'Pular para o conteúdo' }),
    ).toHaveAttribute('href', '#conteudo')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
  })

  it('abre o menu mobile e o fecha ao escolher um item', async () => {
    const user = userEvent.setup()
    renderLayout('/produtos/1')
    const burger = screen.getByRole('button', { name: 'Abrir menu' })
    expect(burger).toHaveAttribute('aria-expanded', 'false')

    await user.click(burger)

    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    expect(
      within(drawer).getByRole('button', { name: 'Fechar menu' }),
    ).toBeInTheDocument()
    await user.click(within(drawer).getByRole('link', { name: 'Produtos' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Lista de produtos')
  })

  it('fecha o menu mobile com Esc', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    // O Drawer prende o foco; o Esc é tratado dentro dele.
    await waitFor(() => {
      expect(drawer.contains(document.activeElement)).toBe(true)
    })
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra no link do carrinho a soma das quantidades', () => {
    renderLayout('/produtos', [{ ...mascaraItem, quantity: 2 }, paletteItem])

    const cartLink = within(headerNav()).getByRole('link', {
      name: 'Carrinho, 3 itens',
    })
    expect(cartLink).toHaveAttribute('href', '/carrinho')
    expect(within(cartLink).getByText('3')).toBeInTheDocument()
  })

  it('com o carrinho vazio, o link não tem contador', () => {
    renderLayout()

    expect(
      within(headerNav()).getByRole('link', { name: 'Carrinho' }),
    ).toBeInTheDocument()
  })

  it('limita o contador visível a 99+', () => {
    renderLayout('/produtos', [
      { ...mascaraItem, quantity: 99 },
      { ...paletteItem, quantity: 34 },
    ])

    const cartLink = within(headerNav()).getByRole('link', {
      name: 'Carrinho, 133 itens',
    })
    expect(within(cartLink).getByText('99+')).toBeInTheDocument()
  })

  it('no celular, o carrinho fica no cabeçalho, com o ícone e o contador, e não no menu', async () => {
    const user = userEvent.setup()
    renderLayout('/produtos', [mascaraItem])
    const compact = () => compactCartLink('Carrinho, 1 item')

    expect(compact()).toHaveTextContent('1')
    await user.click(compact() ?? document.body)

    expect(screen.getByRole('main')).toHaveTextContent('Itens do carrinho')
    expect(compact()).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    expect(within(drawer).queryByRole('link', { name: /^Carrinho/ })).toBeNull()
  })

  it('no celular, com o carrinho vazio, o ícone se chama Carrinho e não tem selo', () => {
    renderLayout()

    const compact = compactCartLink('Carrinho')
    expect(compact).toHaveAttribute('href', '/carrinho')
    expect(compact?.textContent).toBe('')
  })

  it('o tema fica no cabeçalho e, no celular, no menu', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(
      within(screen.getByRole('banner')).getByRole('button', {
        name: 'Tema escuro',
      }),
    ).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))

    expect(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('switch', {
        name: 'Tema escuro',
      }),
    ).not.toBeChecked()
  })

  it('visitante vê Entrar, que volta depois para a página atual', async () => {
    const user = userEvent.setup()
    renderLayout('/produtos/1')

    expect(within(headerNav()).queryByText('Admin')).toBeNull()
    await user.click(within(headerNav()).getByRole('link', { name: 'Entrar' }))

    expect(screen.getByText('Login, depois /produtos/1')).toBeInTheDocument()
  })

  it('logado, vê Admin, o primeiro nome e Sair', () => {
    renderLayout('/produtos', [], activeSession())

    const nav = headerNav()
    expect(within(nav).getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin',
    )
    expect(within(nav).getByText('Emily')).toBeInTheDocument()
    expect(
      within(nav).getByRole('button', { name: 'Sair' }),
    ).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Entrar' })).toBeNull()
  })

  it('o Sair numa página pública fica nela, como visitante', async () => {
    const user = userEvent.setup()
    renderLayout('/carrinho', [], activeSession())

    await user.click(within(headerNav()).getByRole('button', { name: 'Sair' }))

    expect(address()).toHaveTextContent(/^\/carrinho$/)
    expect(
      within(headerNav()).getByRole('link', { name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(readSession()).toBeNull()
  })

  it('o Sair na área administrativa leva ao catálogo, não ao login', async () => {
    const user = userEvent.setup()
    renderLayout('/admin', [], activeSession())
    expect(screen.getByRole('main')).toHaveTextContent('Área administrativa')

    await user.click(within(headerNav()).getByRole('button', { name: 'Sair' }))

    expect(address()).toHaveTextContent(/^\/produtos$/)
    expect(screen.getByRole('main')).toHaveTextContent('Lista de produtos')
  })

  it('no menu mobile, os itens da conta também aparecem e o Sair fecha o menu', async () => {
    const user = userEvent.setup()
    renderLayout('/produtos', [], activeSession())

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    expect(
      within(drawer).getByRole('link', { name: 'Admin' }),
    ).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Sair' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      within(headerNav()).getByRole('link', { name: 'Entrar' }),
    ).toBeInTheDocument()
  })
})
