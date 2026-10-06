import {
  type CurrentUser,
  currentUserSchema,
  type LoginResponse,
  loginResponseSchema,
} from '@/schemas/auth'
import { api, type RequestOptions } from './api'
import { parseResponse } from './parse-response'

// O padrão da DummyJSON, enviado explicitamente para não depender dele.
const DEFAULT_EXPIRES_IN_MINS = 60

export interface LoginCredentials {
  readonly username: string
  readonly password: string
  readonly expiresInMins?: number
}

export async function login(
  {
    username,
    password,
    expiresInMins = DEFAULT_EXPIRES_IN_MINS,
  }: LoginCredentials,
  { signal }: RequestOptions = {},
): Promise<LoginResponse> {
  const path = '/auth/login'
  const { data } = await api.post<unknown>(
    path,
    { username, password, expiresInMins },
    { signal },
  )
  return parseResponse(loginResponseSchema, data, `POST ${path}`)
}

export async function getCurrentUser({
  signal,
}: RequestOptions = {}): Promise<CurrentUser> {
  const path = '/auth/me'
  const { data } = await api.get<unknown>(path, { signal })
  return parseResponse(currentUserSchema, data, `GET ${path}`)
}
