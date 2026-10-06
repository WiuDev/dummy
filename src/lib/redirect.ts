import {
  type LoginRedirectState,
  loginRedirectStateSchema,
} from '@/schemas/auth'
import { paths } from './paths'

export interface LocationLike {
  readonly pathname: string
  readonly search: string
  readonly hash: string
}

// State da navegação até o login, com o caminho atual: o retorno vai no state,
// e não na URL, para um link de fora não conseguir escolher o destino.
export function loginRedirectState(location: LocationLike): LoginRedirectState {
  return { from: `${location.pathname}${location.search}${location.hash}` }
}

// Para onde voltar depois do login (D58): o from validado com Zod, desde que não
// seja o próprio login; qualquer outro valor leva ao catálogo.
export function redirectTarget(state: unknown): string {
  const result = loginRedirectStateSchema.safeParse(state)
  if (!result.success) {
    return paths.products
  }
  const { from } = result.data
  const [pathname] = from.split(/[?#]/, 1)
  return pathname === paths.login ? paths.products : from
}
