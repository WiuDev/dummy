import { notifications } from '@mantine/notifications'
import { act, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { getProduct } from '@/services/products.service'
import { API_URL } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { App } from './App'

// O App já monta o MantineProvider e as notificações; o renderWithProviders
// duplicaria esses providers, então aqui só o roteador vem de fora.
function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

describe('App', () => {
  it('mostra a página em construção com a rota atual', () => {
    renderApp('/produtos/1')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/produtos/1')).toBeInTheDocument()
  })

  it('exibe as falhas de comunicação avisadas pelo interceptor', async () => {
    server.use(http.get(`${API_URL}/products/1`, () => HttpResponse.error()))
    renderApp('/')

    await act(async () => {
      await expect(getProduct(1)).rejects.toMatchObject({ kind: 'network' })
    })

    expect(
      await screen.findByText(
        'Não foi possível conectar. Verifique sua internet.',
      ),
    ).toBeInTheDocument()
  })
})
