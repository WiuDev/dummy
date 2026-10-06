import { readFileSync } from 'node:fs'
import {
  categoriesSchema,
  productSchema,
  productsPageSchema,
} from '../../src/schemas/product.ts'

// As mesmas fixtures dos testes do Vitest (src/test/fixtures), lidas do disco e
// validadas com os schemas do app: se o contrato mudar, o E2E falha já aqui.
function readFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(
      new URL(`../../src/test/fixtures/${name}`, import.meta.url),
      'utf8',
    ),
  )
}

export const fixtures = {
  productsPage: productsPageSchema.parse(readFixture('products-page.json')),
  searchPhone: productsPageSchema.parse(
    readFixture('products-search-phone.json'),
  ),
  smartphones: productsPageSchema.parse(
    readFixture('products-category-smartphones.json'),
  ),
  categories: categoriesSchema.parse(readFixture('categories.json')),
  product1: productSchema.parse(readFixture('product-1.json')),
}
