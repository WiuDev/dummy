import { describe, expect, it } from 'vitest'
import { loginRedirectState, redirectTarget } from './redirect'

describe('loginRedirectState', () => {
  it('guarda o caminho atual, com a busca e o hash', () => {
    expect(
      loginRedirectState({
        pathname: '/produtos',
        search: '?q=phone&pagina=2',
        hash: '#lista',
      }),
    ).toEqual({ from: '/produtos?q=phone&pagina=2#lista' })
  })
})

describe('redirectTarget', () => {
  it.each(['/admin', '/carrinho', '/produtos?q=phone&pagina=2'])(
    'volta para %s',
    (from) => {
      expect(redirectTarget({ from })).toBe(from)
    },
  )

  // Outra origem, outro esquema, o próprio login, vazio ou com espaço que o
  // navegador descartaria: tudo leva ao catálogo.
  it.each([
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    '/login',
    '/login?x=1',
    '/login#topo',
    '',
    '/\t/evil.com',
    'produtos',
  ])('recusa o from %j', (from) => {
    expect(redirectTarget({ from })).toBe('/produtos')
  })

  it.each([42, null, undefined, ['/admin'], { pathname: '/admin' }])(
    'recusa o from que não é string: %j',
    (from) => {
      expect(redirectTarget({ from })).toBe('/produtos')
    },
  )

  it.each([undefined, null, '/admin', 7])(
    'sem state de login (%j), vai para o catálogo',
    (state) => {
      expect(redirectTarget(state)).toBe('/produtos')
    },
  )
})
