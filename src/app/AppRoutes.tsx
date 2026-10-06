import { Navigate, Route, Routes } from 'react-router'
import { CartPage } from '@/features/cart'
import { ProductDetailsPage, ProductsPage } from '@/features/catalog'
import { PublicLayout } from '@/layouts/PublicLayout'
import { paths } from '@/lib/paths'
import { NotFoundPage } from '@/routes/NotFoundPage'

// Rotas declarativas. O PublicLayout é uma layout route: o cabeçalho persiste
// e cada página entra no <Outlet />.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to={paths.products} replace />} />
        <Route path={paths.products} element={<ProductsPage />} />
        <Route path={paths.productPattern} element={<ProductDetailsPage />} />
        <Route path={paths.cart} element={<CartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
