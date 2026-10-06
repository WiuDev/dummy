import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import product1Fixture from '@/test/fixtures/product-1.json'
import { LocationDisplay } from '@/test/location'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { ProductDetailsPage } from './ProductDetailsPage'

function renderDetails(initialEntries: readonly string[]) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/produtos/:id" element={<ProductDetailsPage />} />
        <Route path="/produtos" element={<p>Catálogo</p>} />
      </Routes>
      <LocationDisplay />
    </>,
    { initialEntries },
  )
}

const address = () => screen.getByLabelText('Endereço atual')

describe('ProductDetailsPage', () => {
  it('mostra o produto: galeria, preço, nota, estoque, informações e avaliações', async () => {
    renderDetails(['/produtos/1'])

    expect(screen.getByText('Carregando produto…')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Essence Mascara Lash Princess',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Essence Mascara Lash Princess' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Essence · beauty')).toBeInTheDocument()
    expect(screen.getByText('2,6')).toHaveTextContent('Avaliação: 2,6 de 5')
    expect(screen.getByText('(3 avaliações)')).toBeInTheDocument()
    expect(screen.getByText('US$ 8,94')).toBeInTheDocument()
    expect(screen.getByText('Em estoque')).toBeInTheDocument()
    expect(screen.getByText('99 unidades')).toBeInTheDocument()
    expect(screen.getByText('Garantia: 1 week warranty')).toBeInTheDocument()
    expect(
      screen.getByText('Entrega: Ships in 3-5 business days'),
    ).toBeInTheDocument()
    expect(screen.getByText('Devolução: No return policy')).toBeInTheDocument()
    expect(screen.getByText('mascara')).toBeInTheDocument()

    const reviews = screen.getByRole('region', {
      name: 'Avaliações de clientes',
    })
    expect(within(reviews).getAllByRole('listitem')).toHaveLength(3)
    expect(document.title).toBe('Essence Mascara Lash Princess · Loja Dummy')
  })

  it('com id inválido, avisa que o produto não existe sem chamar a API', () => {
    const requests = recordRequests()
    renderDetails(['/produtos/abc'])

    expect(
      screen.getByRole('heading', { level: 1, name: 'Produto não encontrado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver os produtos' }),
    ).toHaveAttribute('href', '/produtos')
    expect(
      screen.queryByRole('button', { name: 'Tentar novamente' }),
    ).toBeNull()
    expect(requests).toEqual([])
    expect(document.title).toBe('Produto não encontrado · Loja Dummy')
  })

  it('com 404 da API, avisa que o produto não existe, sem tentar de novo', async () => {
    renderDetails(['/produtos/9999'])

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Produto não encontrado',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Tentar novamente' }),
    ).toBeNull()
  })

  it('outras falhas mostram o erro com "Tentar novamente"', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        `${API_URL}/products/1`,
        () => HttpResponse.json({ message: 'falhou' }, { status: 500 }),
        { once: true },
      ),
    )
    renderDetails(['/produtos/1'])

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    )

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Essence Mascara Lash Princess',
      }),
    ).toBeInTheDocument()
  })

  it('Voltar retorna à página anterior, com os filtros do catálogo', async () => {
    const user = userEvent.setup()
    renderDetails(['/produtos?q=phone&pagina=2', '/produtos/1'])

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(address()).toHaveTextContent('/produtos?q=phone&pagina=2')
  })

  it('num deep link, Voltar vai para o catálogo', async () => {
    const user = userEvent.setup()
    renderDetails(['/produtos/1'])

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(address()).toHaveTextContent(/^\/produtos$/)
    expect(screen.getByText('Catálogo')).toBeInTheDocument()
  })

  it('sem marca, esgotado, com uma avaliação e sem tags', async () => {
    server.use(
      http.get(`${API_URL}/products/1`, () =>
        HttpResponse.json({
          ...product1Fixture,
          brand: undefined,
          stock: 0,
          availabilityStatus: 'Out of Stock',
          tags: [],
          reviews: product1Fixture.reviews.slice(0, 1),
        }),
      ),
    )
    renderDetails(['/produtos/1'])

    await screen.findByRole('heading', {
      level: 1,
      name: 'Essence Mascara Lash Princess',
    })
    expect(screen.getByText('beauty')).toBeInTheDocument()
    expect(screen.getByText('Esgotado')).toBeInTheDocument()
    expect(screen.queryByText(/unidades?$/)).toBeNull()
    expect(screen.getByText('(1 avaliação)')).toBeInTheDocument()
    expect(screen.queryByText('mascara')).toBeNull()
  })
})
