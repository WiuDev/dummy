import { notifications } from '@mantine/notifications'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Link, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { readAdminOverlay, writeAdminOverlay } from '@/lib/admin-overlay'
import { lampFields, mascaraAdmin } from '@/test/admin'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { AdminProductsProvider } from '../context/AdminProductsProvider'
import { AdminProductsPage } from './AdminProductsPage'

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

// Overlay com um produto criado aqui (a luminária, id 10000).
function seedLocalProduct() {
  writeAdminOverlay({
    version: 1,
    created: [{ ...lampFields, id: 10_000 }],
    updated: {},
    deleted: [],
    nextLocalId: 10_001,
  })
}

const writes = (requests: readonly Request[]) =>
  requests.filter((request) => request.method !== 'GET')

function renderAdminPage() {
  return renderWithProviders(
    <AdminProductsProvider>
      <Routes>
        <Route path="/admin/produtos" element={<AdminProductsPage />} />
        <Route
          path="/admin/produtos/:id/editar"
          element={<Link to="/admin/produtos">Voltar à tabela</Link>}
        />
      </Routes>
    </AdminProductsProvider>,
    { route: '/admin/produtos', session: activeSession() },
  )
}

const table = () => screen.getByRole('table', { name: 'Produtos' })
const dataRows = () => within(table()).getAllByRole('row').slice(1)
const searchBox = () =>
  screen.getByRole('searchbox', { name: 'Buscar produtos' })

describe('AdminProductsPage', () => {
  it('lista a página do servidor pela rota autenticada, com a contagem', async () => {
    const requests = recordRequests()
    renderAdminPage()

    expect(
      await screen.findByRole('table', { name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(dataRows()).toHaveLength(2)
    expect(screen.getByText('194 produtos')).toBeInTheDocument()
    expect(document.title).toBe('Gestão de produtos · Loja Dummy')
    expect(await summarizeRequest(requests[0])).toMatchObject({
      path: '/auth/products',
      params: { limit: '10', skip: '0' },
      authorization: `Bearer ${activeSession().accessToken}`,
    })
    expect(screen.getByRole('link', { name: 'Novo produto' })).toHaveAttribute(
      'href',
      '/admin/produtos/novo',
    )
  })

  it('as ações de cada linha têm o título do produto no nome (G3)', async () => {
    renderAdminPage()

    expect(
      await screen.findByRole('link', {
        name: 'Editar Essence Mascara Lash Princess',
      }),
    ).toHaveAttribute('href', '/admin/produtos/1/editar')
  })

  it('busca pelo título ou pela descrição na API e pagina o resultado', async () => {
    const user = userEvent.setup()
    renderAdminPage()
    await screen.findByRole('table', { name: 'Produtos' })

    await user.type(searchBox(), 'phone')

    expect(await screen.findByText('23 produtos')).toBeInTheDocument()
    expect(dataRows()).toHaveLength(10)

    await user.click(screen.getByRole('button', { name: 'Página 3' }))

    expect(
      await screen.findByRole('button', { name: 'Página 3' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(dataRows()).toHaveLength(3)
  })

  it('mostra as alterações simuladas do overlay, com os badges', async () => {
    writeAdminOverlay({
      version: 1,
      created: [{ ...lampFields, id: 10_000 }],
      updated: { '1': { ...mascaraAdmin, price: 12.5 } },
      deleted: [
        {
          id: 2,
          title: 'Eyeshadow Palette with Mirror',
          description: 'Paleta',
        },
      ],
      nextLocalId: 10_001,
    })
    renderAdminPage()

    await screen.findByRole('table', { name: 'Produtos' })

    const [local, edited] = dataRows()
    expect(dataRows()).toHaveLength(2)
    expect(local).toHaveTextContent('Luminária de mesaLocal')
    expect(edited).toHaveTextContent('Essence Mascara Lash PrincessSimulado')
    expect(edited).toHaveTextContent('US$ 12,50')
    expect(screen.queryByText('Eyeshadow Palette with Mirror')).toBeNull()
    // 194 do servidor, menos o excluído, mais o criado.
    expect(screen.getByText('194 produtos')).toBeInTheDocument()
  })

  it('a busca e a página sobrevivem à ida ao formulário e à volta (G2)', async () => {
    const user = userEvent.setup()
    renderAdminPage()
    await screen.findByRole('table', { name: 'Produtos' })
    await user.type(searchBox(), 'phone')
    await screen.findByText('23 produtos')
    await user.click(screen.getByRole('button', { name: 'Página 2' }))
    const [firstOfPage2] = await screen.findAllByRole('link', {
      name: /^Editar /,
    })

    await user.click(firstOfPage2 ?? document.body)
    await user.click(screen.getByRole('link', { name: 'Voltar à tabela' }))

    expect(await screen.findByText('23 produtos')).toBeInTheDocument()
    expect(searchBox()).toHaveValue('phone')
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('sem resultados, mostra o estado vazio', async () => {
    const user = userEvent.setup()
    renderAdminPage()
    await screen.findByRole('table', { name: 'Produtos' })

    await user.type(searchBox(), 'nada')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum produto encontrado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tente outra busca.')).toBeInTheDocument()
  })

  it('na falha, mostra o erro e tenta de novo', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        `${API_URL}/auth/products`,
        () => HttpResponse.json({ message: 'falhou' }, { status: 500 }),
        { once: true },
      ),
    )
    renderAdminPage()

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    )

    expect(
      await screen.findByRole('table', { name: 'Produtos' }),
    ).toBeInTheDocument()
  })

  it('exclui um item do servidor com confirmação: chama o DELETE e o tira da tabela', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderAdminPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir Essence Mascara Lash Princess',
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Excluir produto' })
    expect(dialog).toHaveTextContent('Excluir “Essence Mascara Lash Princess”?')
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(
      await screen.findByText('Produto excluído (simulação)'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(dataRows()).toHaveLength(1)
    expect(screen.getByText('193 produtos')).toBeInTheDocument()
    expect(await summarizeRequest(writes(requests)[0])).toMatchObject({
      method: 'DELETE',
      path: '/auth/products/1',
    })
    expect(readAdminOverlay().deleted).toEqual([
      {
        id: 1,
        title: 'Essence Mascara Lash Princess',
        description: mascaraAdmin.description,
      },
    ])
  })

  it('exclui um item local sem chamar a API', async () => {
    const user = userEvent.setup()
    seedLocalProduct()
    const requests = recordRequests()
    renderAdminPage()

    await user.click(
      await screen.findByRole('button', { name: 'Excluir Luminária de mesa' }),
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )

    expect(
      await screen.findByText('Produto excluído (simulação)'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Luminária de mesa')).toBeNull()
    expect(writes(requests)).toEqual([])
    expect(readAdminOverlay().created).toEqual([])
  })

  it('cancelar a exclusão não muda nada', async () => {
    const user = userEvent.setup()
    renderAdminPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir Essence Mascara Lash Princess',
      }),
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Cancelar',
      }),
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(dataRows()).toHaveLength(2)
  })

  it('na falha do DELETE, avisa no diálogo e mantém o item', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete(`${API_URL}/auth/products/1`, () =>
        HttpResponse.json({ message: 'falhou' }, { status: 500 }),
      ),
    )
    renderAdminPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir Essence Mascara Lash Princess',
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Excluir produto' })
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente.',
    )
    expect(dataRows()).toHaveLength(2)
    expect(readAdminOverlay().deleted).toEqual([])
  })

  it('descarta as alterações simuladas com confirmação', async () => {
    const user = userEvent.setup()
    seedLocalProduct()
    renderAdminPage()
    await screen.findByText('Luminária de mesa')

    await user.click(
      screen.getByRole('button', { name: 'Descartar alterações simuladas' }),
    )
    await user.click(
      within(
        screen.getByRole('dialog', { name: 'Descartar alterações simuladas' }),
      ).getByRole('button', { name: 'Descartar' }),
    )

    expect(screen.queryByText('Luminária de mesa')).toBeNull()
    expect(
      screen.getByText('Alterações simuladas descartadas'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Descartar alterações simuladas' }),
    ).toBeDisabled()
  })

  it('sem alterações simuladas, o descarte fica desabilitado', async () => {
    renderAdminPage()
    await screen.findByRole('table', { name: 'Produtos' })

    expect(
      screen.getByRole('button', { name: 'Descartar alterações simuladas' }),
    ).toBeDisabled()
  })
})
