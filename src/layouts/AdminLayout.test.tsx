import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useAdminProducts } from '@/features/admin-products'
import { ADMIN_OVERLAY_KEY, writeAdminOverlay } from '@/lib/admin-overlay'
import { readSession } from '@/lib/auth-session'
import { lampFields } from '@/test/admin'
import { LocationDisplay } from '@/test/location'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { AdminLayout } from './AdminLayout'

// Página filha: só renderiza com o AdminProductsProvider do layout.
function AdminChild() {
  const { overlay } = useAdminProducts()
  return <p>Itens locais: {overlay.created.length}</p>
}

function renderLayout() {
  return renderWithProviders(
    <>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/produtos" element={<AdminChild />} />
        </Route>
        <Route path="/produtos" element={<p>Catálogo</p>} />
      </Routes>
      <LocationDisplay />
    </>,
    { route: '/admin/produtos', session: activeSession() },
  )
}

describe('AdminLayout', () => {
  it('mostra o cabeçalho com o usuário, a navbar e o aviso de simulação', () => {
    renderLayout()

    const header = screen.getByRole('banner')
    expect(
      within(header).getByRole('link', { name: 'Loja Dummy · Admin' }),
    ).toHaveAttribute('href', '/admin/produtos')
    expect(within(header).getByText('Emily')).toBeInTheDocument()
    expect(
      within(header).getByRole('link', { name: 'Ver a loja' }),
    ).toHaveAttribute('href', '/produtos')
    expect(
      within(
        screen.getByRole('navigation', { name: 'Navegação do admin' }),
      ).getByRole('link', { name: 'Produtos' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A DummyJSON simula as gravações',
    )
    expect(screen.getByRole('main')).toHaveTextContent('Itens locais: 0')
  })

  it('recolhe a navbar no desktop e a abre pelo Burger no celular', async () => {
    const user = userEvent.setup()
    renderLayout()
    const desktop = screen.getByRole('button', {
      name: 'Barra lateral do admin',
    })
    const mobile = screen.getByRole('button', { name: 'Menu do admin' })
    expect(desktop).toHaveAttribute('aria-expanded', 'true')
    expect(mobile).toHaveAttribute('aria-expanded', 'false')

    await user.click(desktop)
    await user.click(mobile)

    expect(desktop).toHaveAttribute('aria-expanded', 'false')
    expect(mobile).toHaveAttribute('aria-expanded', 'true')
  })

  it('o Sair leva ao catálogo e apaga a sessão e o overlay', async () => {
    const user = userEvent.setup()
    writeAdminOverlay({
      version: 1,
      created: [{ ...lampFields, id: 10_000 }],
      updated: {},
      deleted: [],
      nextLocalId: 10_001,
    })
    renderLayout()
    expect(screen.getByRole('main')).toHaveTextContent('Itens locais: 1')

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Sair' }),
    )

    expect(screen.getByLabelText('Endereço atual')).toHaveTextContent(
      /^\/produtos$/,
    )
    expect(readSession()).toBeNull()
    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()
  })
})
