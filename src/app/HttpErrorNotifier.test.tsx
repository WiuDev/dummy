import { notifications } from '@mantine/notifications'
import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { AppError } from '@/lib/errors'
import { httpErrorEvents } from '@/services/http-events'
import { getProduct } from '@/services/products.service'
import { API_URL } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { HttpErrorNotifier } from './HttpErrorNotifier'

// As notificações do Mantine ficam num estado global: limpa entre os testes.
afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

describe('HttpErrorNotifier', () => {
  it('mostra a falha avisada pelo canal', async () => {
    renderWithProviders(<HttpErrorNotifier />)

    act(() => {
      httpErrorEvents.emit(new AppError('timeout'))
    })

    expect(
      await screen.findByText(
        'O servidor demorou a responder. Tente novamente.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Falha de comunicação')).toBeInTheDocument()
  })

  it('não repete a notificação de um mesmo tipo de falha', async () => {
    renderWithProviders(<HttpErrorNotifier />)

    act(() => {
      httpErrorEvents.emit(new AppError('server'))
      httpErrorEvents.emit(new AppError('server'))
    })

    expect(
      await screen.findAllByText('Erro no servidor. Tente novamente.'),
    ).toHaveLength(1)
  })

  it('para de ouvir o canal ao desmontar', () => {
    const { rerender } = renderWithProviders(<HttpErrorNotifier />)
    rerender(<div />)

    act(() => {
      httpErrorEvents.emit(new AppError('network'))
    })

    expect(
      screen.queryByText('Não foi possível conectar. Verifique sua internet.'),
    ).not.toBeInTheDocument()
  })

  it('mostra a falha de rede de uma chamada real, capturada pelo interceptor', async () => {
    server.use(http.get(`${API_URL}/products/1`, () => HttpResponse.error()))
    renderWithProviders(<HttpErrorNotifier />)

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
