import type { CartItem } from '@/schemas/cart'

// Produtos 1 e 2 das fixtures (products-page.json) como o carrinho os guarda:
// rímel de 9,99 com 10,48% de desconto (8,94) e paleta de 19,99 com 18,19%
// (16,35).
export const mascaraProduct: Omit<CartItem, 'quantity'> = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  discountPercentage: 10.48,
  stock: 99,
  thumbnail:
    'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
}

export const paletteProduct: Omit<CartItem, 'quantity'> = {
  id: 2,
  title: 'Eyeshadow Palette with Mirror',
  price: 19.99,
  discountPercentage: 18.19,
  stock: 34,
  thumbnail:
    'https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/thumbnail.webp',
}

export const mascaraItem: CartItem = { ...mascaraProduct, quantity: 1 }
export const paletteItem: CartItem = { ...paletteProduct, quantity: 1 }
