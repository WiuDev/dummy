import { describe, expect, it } from 'vitest'
import { catalogSearchParamsSchema, productIdParamSchema } from './catalog'

describe('catalogSearchParamsSchema', () => {
  it('lê busca, categoria e página válidas', () => {
    expect(
      catalogSearchParamsSchema.parse({
        q: '  phone ',
        categoria: 'smartphones',
        pagina: '2',
      }),
    ).toEqual({ q: 'phone', categoria: 'smartphones', pagina: 2 })
  })

  it('usa os padrões quando os parâmetros faltam', () => {
    expect(catalogSearchParamsSchema.parse({})).toEqual({
      q: '',
      categoria: undefined,
      pagina: 1,
    })
  })

  it('troca valores inválidos pelo padrão em vez de falhar', () => {
    expect(
      catalogSearchParamsSchema.parse({
        q: 'x'.repeat(101),
        categoria: 'Não Válida',
        pagina: 'abc',
      }),
    ).toEqual({ q: '', categoria: undefined, pagina: 1 })
  })

  it.each(['0', '-1', '1.5', 'Infinity', ''])(
    'trata a página %j como 1',
    (pagina) => {
      expect(catalogSearchParamsSchema.parse({ pagina }).pagina).toBe(1)
    },
  )

  it('aceita slugs com hífen', () => {
    expect(
      catalogSearchParamsSchema.parse({ categoria: 'mobile-accessories' })
        .categoria,
    ).toBe('mobile-accessories')
  })
})

describe('productIdParamSchema', () => {
  it('converte o id da rota em número', () => {
    expect(productIdParamSchema.parse('42')).toBe(42)
  })

  it.each(['abc', '0', '-2', '1.5', '', undefined])('rejeita o id %j', (id) => {
    expect(productIdParamSchema.safeParse(id).success).toBe(false)
  })
})
