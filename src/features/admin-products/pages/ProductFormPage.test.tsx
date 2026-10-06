import { notifications } from '@mantine/notifications'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { readAdminOverlay, writeAdminOverlay } from '@/lib/admin-overlay'
import { lampFields } from '@/test/admin'
import { LocationDisplay } from '@/test/location'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { AdminProductsProvider } from '../context/AdminProductsProvider'
import { ProductFormPage } from './ProductFormPage'

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

function renderForm(route: string) {
  return renderWithProviders(
    <AdminProductsProvider>
      <Routes>
        <Route path="/admin/produtos/novo" element={<ProductFormPage />} />
        <Route
          path="/admin/produtos/:id/editar"
          element={<ProductFormPage />}
        />
        <Route path="/admin/produtos" element={<p>Tabela</p>} />
      </Routes>
      <LocationDisplay />
    </AdminProductsProvider>,
    { route, session: activeSession() },
  )
}

const field = (name: string) => screen.getByRole('textbox', { name })
const address = () => screen.getByLabelText('Endereço atual')
const writes = (requests: readonly Request[]) =>
  requests.filter((request) => request.method !== 'GET')

// Cola os textos longos (um evento só, em vez de um por tecla): com a suíte
// inteira em paralelo, digitar tudo deixava estes testes perto do limite.
async function paste(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  text: string,
) {
  await user.click(field(name))
  await user.paste(text)
}

async function fillNewProduct(user: ReturnType<typeof userEvent.setup>) {
  await paste(user, 'Título', 'Luminária de mesa')
  await paste(user, 'Descrição', 'Luminária de LED com braço articulado.')
  // As categorias vêm da API: o Select fica desabilitado até chegarem.
  const category = await screen.findByRole('combobox', { name: 'Categoria' })
  await waitFor(() => {
    expect(category).toBeEnabled()
  })
  await user.click(category)
  await user.click(
    await screen.findByRole('option', { name: 'Home Decoration' }),
  )
  await user.type(field('Preço (US$)'), '59.9')
  await user.type(field('Estoque'), '12')
  await paste(user, 'URL da imagem', 'https://cdn.dummyjson.com/luminaria.webp')
}

describe('ProductFormPage: cadastro', () => {
  it('valida no envio, com as mensagens em pt-BR, sem chamar a API', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderForm('/admin/produtos/novo')

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByText('Use de 3 a 100 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Escolha a categoria.')).toBeInTheDocument()
    expect(screen.getByText('Informe o preço.')).toBeInTheDocument()
    expect(writes(requests)).toEqual([])
    expect(document.title).toBe('Novo produto · Loja Dummy')
  })

  it('recusa a imagem fora de https assim que sai do campo', async () => {
    const user = userEvent.setup()
    renderForm('/admin/produtos/novo')

    await user.type(field('URL da imagem'), 'http://cdn.dummyjson.com/x.webp')
    await user.tab()

    expect(
      screen.getByText('Use um endereço que comece com https://.'),
    ).toBeInTheDocument()
  })

  it('cadastra: envia o POST, guarda o item local e volta à tabela', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderForm('/admin/produtos/novo')

    await fillNewProduct(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Tabela')).toBeInTheDocument()
    expect(address()).toHaveTextContent(/^\/admin\/produtos$/)
    expect(
      screen.getByText('Produto cadastrado (simulação)'),
    ).toBeInTheDocument()
    expect(await summarizeRequest(writes(requests)[0])).toMatchObject({
      method: 'POST',
      path: '/auth/products/add',
      body: {
        title: 'Luminária de mesa',
        category: 'home-decoration',
        price: 59.9,
        stock: 12,
        discountPercentage: 0,
      },
    })
    expect(readAdminOverlay().created).toEqual([
      {
        ...lampFields,
        id: 10_000,
        brand: undefined,
        discountPercentage: 0,
        tags: [],
      },
    ])
  })

  it('durante o envio, os campos ficam desabilitados', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_URL}/auth/products/add`, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    renderForm('/admin/produtos/novo')

    await fillNewProduct(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByRole('button', { name: 'Cadastrar' })).toHaveAttribute(
      'data-loading',
      'true',
    )
    expect(field('Título')).toBeDisabled()
  })
})

describe('ProductFormPage: edição', () => {
  it('edita um item do servidor: pré-preenche pelo GET e junta a resposta do PUT', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderForm('/admin/produtos/1/editar')

    expect(
      await screen.findByDisplayValue('Essence Mascara Lash Princess'),
    ).toBe(field('Título'))
    await user.clear(field('Preço (US$)'))
    await user.type(field('Preço (US$)'), '12.5')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Tabela')).toBeInTheDocument()
    expect(
      screen.getByText('Alterações salvas (simulação)'),
    ).toBeInTheDocument()
    expect(await summarizeRequest(writes(requests)[0])).toMatchObject({
      method: 'PUT',
      path: '/auth/products/1',
      body: { title: 'Essence Mascara Lash Princess', price: 12.5 },
    })
    expect(readAdminOverlay().updated['1']).toMatchObject({
      id: 1,
      title: 'Essence Mascara Lash Princess',
      price: 12.5,
      tags: ['beauty', 'mascara'],
    })
  })

  it('edita um item local sem chamar a API', async () => {
    const user = userEvent.setup()
    writeAdminOverlay({
      version: 1,
      created: [{ ...lampFields, id: 10_000 }],
      updated: {},
      deleted: [],
      nextLocalId: 10_001,
    })
    const requests = recordRequests()
    renderForm('/admin/produtos/10000/editar')

    await user.clear(field('Título'))
    await paste(user, 'Título', 'Luminária de chão')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Tabela')).toBeInTheDocument()
    expect(writes(requests)).toEqual([])
    expect(readAdminOverlay().created[0]?.title).toBe('Luminária de chão')
  })

  it.each([
    ['inválido', '/admin/produtos/abc/editar'],
    ['que a API não conhece', '/admin/produtos/9999/editar'],
    ['local que não existe mais', '/admin/produtos/10007/editar'],
  ])('com id %s, avisa que o produto não existe', async (_case, route) => {
    renderForm(route)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Produto não encontrado',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Voltar à tabela' }),
    ).toHaveAttribute('href', '/admin/produtos')
  })

  it('um item excluído nesta sessão não abre para edição', () => {
    writeAdminOverlay({
      version: 1,
      created: [],
      updated: {},
      deleted: [{ id: 1, title: 'Essence', description: 'Rímel' }],
      nextLocalId: 10_000,
    })
    renderForm('/admin/produtos/1/editar')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Produto não encontrado' }),
    ).toBeInTheDocument()
  })

  it('na falha do PUT, avisa e mantém o formulário', async () => {
    const user = userEvent.setup()
    server.use(
      http.put(`${API_URL}/auth/products/1`, () =>
        HttpResponse.json({ message: 'falhou' }, { status: 500 }),
      ),
    )
    renderForm('/admin/produtos/1/editar')

    await screen.findByDisplayValue('Essence Mascara Lash Princess')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvarErro no servidor. Tente novamente.',
    )
    expect(field('Título')).toHaveValue('Essence Mascara Lash Princess')
    expect(readAdminOverlay().updated).toEqual({})
  })

  it('na falha ao carregar, mostra o erro e tenta de novo', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        `${API_URL}/auth/products/1`,
        () => HttpResponse.json({ message: 'falhou' }, { status: 500 }),
        { once: true },
      ),
    )
    renderForm('/admin/produtos/1/editar')

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    )

    expect(
      await screen.findByDisplayValue('Essence Mascara Lash Princess'),
    ).toBeInTheDocument()
  })
})
