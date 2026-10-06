// Caminhos das rotas, centralizados (D14). Links e rotas usam estes valores em
// vez de strings soltas.
export const paths = {
  home: '/',
  products: '/produtos',
  productPattern: '/produtos/:id',
  product: (id: number): string => `/produtos/${id}`,
  cart: '/carrinho',
} as const
