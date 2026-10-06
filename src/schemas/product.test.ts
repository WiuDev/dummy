import { describe, expect, it } from 'vitest'
import categoriesFixture from '@/test/fixtures/categories.json'
import product1Fixture from '@/test/fixtures/product-1.json'
import productAddFixture from '@/test/fixtures/product-add.json'
import productDeleteFixture from '@/test/fixtures/product-delete.json'
import productUpdateFixture from '@/test/fixtures/product-update.json'
import categoryPageFixture from '@/test/fixtures/products-category-smartphones.json'
import productsPageFixture from '@/test/fixtures/products-page.json'
import searchPageFixture from '@/test/fixtures/products-search-phone.json'
import {
  categoriesSchema,
  deletedProductResponseSchema,
  productInputSchema,
  productMutationResponseSchema,
  productSchema,
  productsPageSchema,
  reviewSchema,
} from './product'

describe('contrato de produtos', () => {
  it('aceita o produto completo devolvido por GET /products/1', () => {
    const result = productSchema.safeParse(product1Fixture)

    expect(result.success).toBe(true)
    expect(result.data?.reviews.length).toBeGreaterThan(0)
  })

  it.each([
    ['GET /products', productsPageFixture],
    ['GET /products/search', searchPageFixture],
    ['GET /products/category/:slug', categoryPageFixture],
  ])('aceita a página de %s pedida com select', (_endpoint, fixture) => {
    const result = productsPageSchema.safeParse(fixture)

    expect(result.success).toBe(true)
    expect(result.data?.products.length).toBeGreaterThan(0)
  })

  it('aceita a lista de categorias', () => {
    const result = categoriesSchema.safeParse(categoriesFixture)

    expect(result.success).toBe(true)
    expect(result.data?.[0]).toEqual({
      slug: 'beauty',
      name: 'Beauty',
      url: 'https://dummyjson.com/products/category/beauty',
    })
  })

  it('aceita as respostas parciais de POST e PUT', () => {
    expect(
      productMutationResponseSchema.safeParse(productAddFixture).success,
    ).toBe(true)
    expect(
      productMutationResponseSchema.safeParse(productUpdateFixture).success,
    ).toBe(true)
  })

  it('aceita a resposta de DELETE com isDeleted e deletedOn', () => {
    const result = deletedProductResponseSchema.safeParse(productDeleteFixture)

    expect(result.success).toBe(true)
    expect(result.data?.isDeleted).toBe(true)
  })

  it('aceita produto sem brand, que falta em parte do catálogo', () => {
    const withoutBrand: Record<string, unknown> = { ...product1Fixture }
    delete withoutBrand['brand']

    const result = productSchema.safeParse(withoutBrand)

    expect(result.success).toBe(true)
    expect(result.data?.brand).toBeUndefined()
  })

  it('descarta campos desconhecidos', () => {
    const result = productSchema.safeParse({
      ...product1Fixture,
      campoNovo: 'x',
    })

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('campoNovo')
  })

  it('rejeita preço negativo e desconto acima de 100%', () => {
    expect(
      productSchema.safeParse({ ...product1Fixture, price: -1 }).success,
    ).toBe(false)
    expect(
      productSchema.safeParse({ ...product1Fixture, discountPercentage: 120 })
        .success,
    ).toBe(false)
  })

  it('rejeita avaliação fora de 1 a 5 e data que não é ISO', () => {
    const review = product1Fixture.reviews[0]

    expect(reviewSchema.safeParse({ ...review, rating: 6 }).success).toBe(false)
    expect(reviewSchema.safeParse({ ...review, rating: 0 }).success).toBe(false)
    expect(
      reviewSchema.safeParse({ ...review, date: '30/04/2025' }).success,
    ).toBe(false)
  })

  it('rejeita página sem a lista de produtos', () => {
    expect(
      productsPageSchema.safeParse({ total: 0, skip: 0, limit: 0 }).success,
    ).toBe(false)
  })

  it('aceita entrada parcial para cadastro e edição', () => {
    expect(productInputSchema.safeParse({}).success).toBe(true)
    expect(
      productInputSchema.safeParse({ title: 'Novo', price: 10 }).success,
    ).toBe(true)
    expect(productInputSchema.safeParse({ price: 'dez' }).success).toBe(false)
  })
})
