import { fixtures } from './fixtures.ts'

// Script para o page.addInitScript que grava a sessão da fixture de login no
// localStorage antes de a página carregar, com o vencimento dado. Vai como
// texto, porque o tsconfig do E2E não tem os tipos do DOM.
export function sessionScript(expiresAt: number): string {
  const { id, username, email, firstName, lastName, image } = fixtures.login
  const session = JSON.stringify({
    version: 1,
    accessToken: fixtures.login.accessToken,
    expiresAt,
    user: { id, username, email, firstName, lastName, image },
  })
  return `localStorage.setItem('dummy:auth:v1', ${JSON.stringify(session)})`
}
