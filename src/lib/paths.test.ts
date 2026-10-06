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

  it('tem os caminhos do carrinho, do login e da área administrativa', () => {
    expect(paths.cart).toBe('/carrinho')
    expect(paths.login).toBe('/login')
    expect(paths.admin).toBe('/admin')
  })

  it('monta os caminhos da gestão de produtos sob /admin', () => {
    expect(paths.adminProducts).toBe('/admin/produtos')
    expect(paths.adminProductNew).toBe('/admin/produtos/novo')
    expect(paths.adminProductEditPattern).toBe('/admin/produtos/:id/editar')
    expect(paths.adminProductEdit(10_000)).toBe('/admin/produtos/10000/editar')
  })
})
