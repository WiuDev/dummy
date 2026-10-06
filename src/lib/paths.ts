// Caminhos das rotas, centralizados (D14). Links e rotas usam estes valores em
// vez de strings soltas.
export const paths = {
  home: '/',
  products: '/produtos',
  productPattern: '/produtos/:id',
  product: (id: number): string => `/produtos/${id}`,
  cart: '/carrinho',
  login: '/login',
  admin: '/admin',
  adminProducts: '/admin/produtos',
  adminProductNew: '/admin/produtos/novo',
  adminProductEditPattern: '/admin/produtos/:id/editar',
  adminProductEdit: (id: number): string => `/admin/produtos/${id}/editar`,
} as const

// Páginas da área administrativa, todas protegidas pelo RequireAuth.
export function isAdminPath(pathname: string): boolean {
  return pathname === paths.admin || pathname.startsWith(`${paths.admin}/`)
}
