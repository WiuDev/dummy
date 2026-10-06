import type { AdminProduct } from '@/schemas/admin'
import { type ProductsPage, productsPageSchema } from '@/schemas/product'
import productsPageFixture from './fixtures/products-page.json'
import searchPhoneFixture from './fixtures/products-search-phone.json'

// Páginas do servidor das fixtures: a lista (2 itens de 194) e a busca "phone"
// (23 itens).
export const listPage: ProductsPage =
  productsPageSchema.parse(productsPageFixture)
export const phoneSearch: ProductsPage =
  productsPageSchema.parse(searchPhoneFixture)

// Campos de um produto criado no admin, como o formulário os entrega.
export const lampFields: Omit<AdminProduct, 'id'> = {
  title: 'Luminária de mesa',
  description: 'Luminária de LED com braço articulado.',
  category: 'home-decoration',
  price: 59.9,
  discountPercentage: 5,
  stock: 12,
  brand: 'Casa Clara',
  tags: ['iluminação'],
  thumbnail: 'https://cdn.dummyjson.com/luminaria.webp',
}

// O produto 1 das fixtures como o admin o guarda.
export const mascaraAdmin: AdminProduct = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description:
    'The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula.',
  category: 'beauty',
  price: 9.99,
  discountPercentage: 10.48,
  stock: 99,
  brand: 'Essence',
  tags: ['beauty', 'mascara'],
  thumbnail:
    'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
}
