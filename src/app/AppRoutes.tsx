import { Navigate, Route, Routes } from 'react-router'
import { LoginPage } from '@/features/auth'
import { CartPage } from '@/features/cart'
import { ProductDetailsPage, ProductsPage } from '@/features/catalog'
import { PublicLayout } from '@/layouts/PublicLayout'
import { paths } from '@/lib/paths'
import { AdminPlaceholderPage } from '@/routes/AdminPlaceholderPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { RequireAuth } from '@/routes/RequireAuth'

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
        <Route path={paths.login} element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path={paths.admin} element={<AdminPlaceholderPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
