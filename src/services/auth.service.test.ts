import { describe, expect, it } from 'vitest'
import loginFixture from '@/test/fixtures/login.json'
import { recordRequests, summarizeRequest } from '@/test/msw/requests'
import { seedActiveSession } from '@/test/session'
import { getCurrentUser, login } from './auth.service'

const USER = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
}

describe('login', () => {
  it('envia as credenciais com a duração padrão de 60 minutos', async () => {
    const requests = recordRequests()

    const response = await login({
      username: 'emilys',
      password: 'emilyspass',
    })

    expect(await summarizeRequest(requests[0])).toEqual({
      method: 'POST',
      path: '/auth/login',
      params: {},
      authorization: null,
      body: { username: 'emilys', password: 'emilyspass', expiresInMins: 60 },
    })
    // Campos fora do contrato (como gender) ficam de fora.
    expect(response).toEqual({
      ...USER,
      accessToken: loginFixture.accessToken,
      refreshToken: loginFixture.refreshToken,
    })
  })

  it('respeita a duração pedida', async () => {
    const requests = recordRequests()

    await login({
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 30,
    })

    const { body } = await summarizeRequest(requests[0])
    expect(body).toMatchObject({ expiresInMins: 30 })
  })

  it('informa credenciais inválidas como bad_request, com a mensagem da API', async () => {
    await expect(
      login({ username: 'emilys', password: 'errada' }),
    ).rejects.toMatchObject({
      kind: 'bad_request',
      status: 400,
      serverMessage: 'Invalid credentials',
    })
  })
})

describe('getCurrentUser', () => {
  it('carrega o usuário da sessão, só com os campos do contrato', async () => {
    const session = seedActiveSession()
    const requests = recordRequests()

    const user = await getCurrentUser()

    const { path, authorization } = await summarizeRequest(requests[0])
    expect(path).toBe('/auth/me')
    expect(authorization).toBe(`Bearer ${session.accessToken}`)
    expect(user).toEqual({ ...USER, role: 'admin' })
  })

  it('sem sessão, falha sem enviar a requisição', async () => {
    const requests = recordRequests()

    await expect(getCurrentUser()).rejects.toMatchObject({
      kind: 'unauthorized',
    })
    expect(requests).toEqual([])
  })
})
