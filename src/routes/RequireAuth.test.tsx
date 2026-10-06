import { notifications } from '@mantine/notifications'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { redirectTarget } from '@/lib/redirect'
import { unauthorizedEvents } from '@/services/http-events'
import { LocationDisplay } from '@/test/location'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { RequireAuth } from './RequireAuth'

// No lugar do login: mostra para onde o login voltaria.
function LoginProbe() {
  const location = useLocation()
  return <p>Login, depois {redirectTarget(location.state)}</p>
}

function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        void navigate(-1)
      }}
    >
      Voltar no histórico
    </button>
  )
}

function renderProtected(initialEntries: readonly string[], signedIn: boolean) {
  return renderWithProviders(
    <>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<p>Área protegida</p>} />
        </Route>
        <Route path="/login" element={<LoginProbe />} />
        <Route path="/produtos" element={<p>Catálogo</p>} />
      </Routes>
      <LocationDisplay />
      <BackButton />
    </>,
    { initialEntries, ...(signedIn ? { session: activeSession() } : {}) },
  )
}

afterEach(() => {
  act(() => {
    notifications.clean()
  })
})

const address = () => screen.getByLabelText('Endereço atual')

describe('RequireAuth', () => {
  it('com sessão, mostra a página protegida', () => {
    renderProtected(['/admin'], true)

    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })

  it('sem sessão, leva ao login com o caminho atual para voltar depois', () => {
    renderProtected(['/admin?aba=produtos'], false)

    expect(address()).toHaveTextContent(/^\/login$/)
    expect(
      screen.getByText('Login, depois /admin?aba=produtos'),
    ).toBeInTheDocument()
  })

  it('o redirecionamento não fica no histórico', async () => {
    const user = userEvent.setup()
    renderProtected(['/produtos', '/admin'], false)

    await user.click(
      screen.getByRole('button', { name: 'Voltar no histórico' }),
    )

    expect(address()).toHaveTextContent(/^\/produtos$/)
  })

  it('se a sessão acaba na página protegida, leva ao login', () => {
    renderProtected(['/admin'], true)

    act(() => {
      unauthorizedEvents.emit({ reason: 'rejected', url: '/auth/products' })
    })

    expect(screen.getByText('Login, depois /admin')).toBeInTheDocument()
  })
})
