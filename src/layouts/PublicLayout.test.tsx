import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { PublicLayout } from './PublicLayout'

function renderLayout(route = '/produtos') {
  return renderWithProviders(
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/produtos" element={<p>Lista de produtos</p>} />
        <Route path="/produtos/:id" element={<p>Detalhe do produto</p>} />
      </Route>
    </Routes>,
    { route },
  )
}

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
})
