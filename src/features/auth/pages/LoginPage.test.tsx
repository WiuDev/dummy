import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { type InitialEntry, Route, Routes, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'
import { readSession } from '@/lib/auth-session'
import { LocationDisplay } from '@/test/location'
import { API_URL } from '@/test/msw/handlers'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'
import { activeSession } from '@/test/session'
import { LoginPage } from './LoginPage'

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

function renderLogin(
  initialEntries: readonly InitialEntry[],
  options: { readonly signedIn?: boolean } = {},
) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<p>Área protegida</p>} />
        <Route path="/carrinho" element={<p>Carrinho</p>} />
        <Route path="/produtos" element={<p>Catálogo</p>} />
      </Routes>
      <LocationDisplay />
      <BackButton />
    </>,
    {
      initialEntries,
      ...(options.signedIn === true ? { session: activeSession() } : {}),
    },
  )
}

const address = () => screen.getByLabelText('Endereço atual')
const usernameInput = () => screen.getByRole('textbox', { name: 'Usuário' })
const passwordInput = () => screen.getByLabelText('Senha')
const submitButton = () => screen.getByRole('button', { name: 'Entrar' })

async function fillAndSubmit(username: string, password: string) {
  const user = userEvent.setup()
  await user.type(usernameInput(), username)
  await user.type(passwordInput(), password)
  await user.click(submitButton())
  return user
}

describe('LoginPage', () => {
  it('mostra o formulário pronto para os gerenciadores de senha', () => {
    renderLogin(['/login'])

    expect(
      screen.getByRole('heading', { level: 1, name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Entrar · Loja Dummy')
    expect(usernameInput()).toHaveAttribute('autocomplete', 'username')
    expect(usernameInput()).toHaveAttribute('name', 'username')
    expect(passwordInput()).toHaveAttribute('autocomplete', 'current-password')
    expect(passwordInput()).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('button', { name: 'Mostrar a senha' }),
    ).toBeInTheDocument()
  })

  it('valida no envio, com as mensagens em pt-BR, sem chamar a API', async () => {
    const user = userEvent.setup()
    const requests = recordRequests()
    renderLogin(['/login'])

    await user.click(submitButton())

    expect(screen.getByText('Informe o usuário.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(usernameInput()).toHaveAttribute('aria-invalid', 'true')
    expect(requests).toEqual([])
  })

  it('com credenciais erradas, avisa, apaga a senha e põe o foco nela', async () => {
    renderLogin(['/login'])

    await fillAndSubmit('emilys', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuário ou senha inválidos.',
    )
    expect(passwordInput()).toHaveValue('')
    expect(passwordInput()).toHaveFocus()
    expect(usernameInput()).toHaveValue('emilys')
    expect(readSession()).toBeNull()
  })

  it('ao entrar, volta para a origem sem deixar o login no histórico', async () => {
    const requests = recordRequests()
    renderLogin([
      '/produtos',
      { pathname: '/login', state: { from: '/admin' } },
    ])

    const user = await fillAndSubmit(' emilys ', 'emilyspass')

    expect(await screen.findByText('Área protegida')).toBeInTheDocument()
    expect(address()).toHaveTextContent(/^\/admin$/)
    expect(readSession()?.user.firstName).toBe('Emily')
    expect(await summarizeRequest(requests[0])).toMatchObject({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'emilys', password: 'emilyspass', expiresInMins: 60 },
    })

    await user.click(
      screen.getByRole('button', { name: 'Voltar no histórico' }),
    )

    expect(address()).toHaveTextContent(/^\/produtos$/)
  })

  it('com um from inválido, vai para o catálogo', async () => {
    renderLogin([{ pathname: '/login', state: { from: '//evil.com' } }])

    await fillAndSubmit('emilys', 'emilyspass')

    expect(await screen.findByText('Catálogo')).toBeInTheDocument()
  })

  it('quem já está logado não vê o formulário e volta para a origem', () => {
    renderLogin([{ pathname: '/login', state: { from: '/carrinho' } }], {
      signedIn: true,
    })

    expect(screen.getByText('Carrinho')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull()
  })

  it('durante o envio, o botão fica ocupado', async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    renderLogin(['/login'])

    await fillAndSubmit('emilys', 'emilyspass')

    expect(submitButton()).toHaveAttribute('data-loading', 'true')
    expect(submitButton()).toBeDisabled()
  })

  it('numa falha de comunicação, mostra o motivo', async () => {
    server.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.error()))
    renderLogin(['/login'])

    await fillAndSubmit('emilys', 'emilyspass')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua internet.',
    )
  })
})
