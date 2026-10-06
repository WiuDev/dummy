import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import productsPageFixture from '@/test/fixtures/products-page.json'
import { LocationDisplay } from '@/test/location'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { ProductsPage } from './ProductsPage'

function renderPage(route: string) {
  return renderWithProviders(
    <>
      <ProductsPage />
      <LocationDisplay />
    </>,
    { route },
  )
}

const address = () => screen.getByLabelText('Endereço atual')

async function productItems() {
  const list = await screen.findByRole('list', { name: 'Produtos' })
  return within(list).queryAllByRole('listitem')
}

async function chooseCategory(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  const combobox = screen.getByRole('combobox', { name: 'Categoria' })
  await waitFor(() => {
    expect(combobox).toBeEnabled()
  })
  await user.click(combobox)
  await user.click(await screen.findByRole('option', { name }))
}

describe('ProductsPage', () => {
  it('mostra o skeleton e depois a grade, com a contagem e o título da aba', async () => {
    renderPage('/produtos')

    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument()
    expect(await productItems()).toHaveLength(2)
    expect(screen.getByText('194 produtos')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Produtos · Loja Dummy')
  })

  it('a busca vai para a URL depois do debounce e volta para a página 1', async () => {
    const user = userEvent.setup()
    renderPage('/produtos?pagina=3')
    await productItems()

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar produtos' }),
      'phone',
    )

    await waitFor(() => {
      expect(address()).toHaveTextContent('/produtos?q=phone')
    })
    expect(await screen.findByText('23 produtos')).toBeInTheDocument()
    expect(await productItems()).toHaveLength(12)
  })

  it('com busca e categoria, usa o modo combinado', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderPage('/produtos?q=phone')
    await screen.findByText('23 produtos')

    await chooseCategory(user, 'Smartphones')

    await waitFor(() => {
      expect(address()).toHaveTextContent(
        '/produtos?q=phone&categoria=smartphones',
      )
    })
    expect(await screen.findByText('16 produtos')).toBeInTheDocument()
    const search = await summarizeRequest(requests.at(-1))
    expect(search).toMatchObject({
      path: '/products/search',
      params: { q: 'phone', limit: '0', skip: '0' },
    })
  })

  it('a paginação leva à página seguinte', async () => {
    const user = userEvent.setup()
    renderPage('/produtos?q=phone&categoria=smartphones')
    await screen.findByText('16 produtos')

    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    await waitFor(() => {
      expect(address()).toHaveTextContent(
        '/produtos?q=phone&categoria=smartphones&pagina=2',
      )
    })
    await waitFor(async () => {
      expect(await productItems()).toHaveLength(4)
    })
    expect(
      screen.getByRole('button', { name: 'Próxima página' }),
    ).toBeDisabled()
  })

  it('sem resultados, oferece limpar os filtros', async () => {
    const user = userEvent.setup()
    renderPage('/produtos?q=nada')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum produto encontrado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nenhum produto')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() => {
      expect(address()).toHaveTextContent(/^\/produtos$/)
    })
    expect(await productItems()).toHaveLength(2)
    expect(
      screen.getByRole('searchbox', { name: 'Buscar produtos' }),
    ).toHaveValue('')
  })

  it('na falha, mostra o erro e tenta de novo', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        `${API_URL}/products`,
        () => HttpResponse.json({ message: 'falhou' }, { status: 500 }),
        { once: true },
      ),
    )
    renderPage('/produtos')

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    )

    expect(await productItems()).toHaveLength(2)
  })

  it('uma página além da última vai para a última, sem nova entrada no histórico', async () => {
    renderPage('/produtos?q=phone&pagina=9')

    await waitFor(() => {
      expect(address()).toHaveTextContent('/produtos?q=phone&pagina=2')
    })
    expect(await screen.findByText('23 produtos')).toBeInTheDocument()
  })

  it('parâmetros inválidos voltam ao padrão', async () => {
    renderPage('/produtos?pagina=abc&categoria=N%C3%A3o&q=')

    await waitFor(() => {
      expect(address()).toHaveTextContent(/^\/produtos$/)
    })
    expect(await productItems()).toHaveLength(2)
  })

  it('conta no singular quando só há um produto', async () => {
    server.use(
      http.get(`${API_URL}/products/search`, () =>
        HttpResponse.json({
          products: productsPageFixture.products.slice(0, 1),
          total: 1,
          skip: 0,
          limit: 1,
        }),
      ),
    )
    renderPage('/produtos?q=mascara')

    expect(await screen.findByText('1 produto')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).toBeNull()
  })
})
