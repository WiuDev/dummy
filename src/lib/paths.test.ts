import { describe, expect, it } from 'vitest'
import { paths } from './paths'

describe('paths', () => {
  it('monta o caminho do detalhe de um produto', () => {
    expect(paths.product(1)).toBe('/produtos/1')
  })

  it('mantém a lista e o padrão do detalhe sob o mesmo prefixo', () => {
    expect(paths.products).toBe('/produtos')
    expect(paths.productPattern).toBe('/produtos/:id')
    expect(paths.home).toBe('/')
  })

  it('tem o caminho do carrinho', () => {
    expect(paths.cart).toBe('/carrinho')
  })
})
