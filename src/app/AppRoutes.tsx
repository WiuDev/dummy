import { Center, Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { LoginPage } from '@/features/auth'
import { CartPage } from '@/features/cart'
import { ProductDetailsPage, ProductsPage } from '@/features/catalog'
import { PublicLayout } from '@/layouts/PublicLayout'
import { paths } from '@/lib/paths'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { RequireAuth } from '@/routes/RequireAuth'

// A área administrativa sai do bundle principal (D53): o layout e as páginas
// chegam num chunk próprio na primeira visita ao /admin.
const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((module) => ({
    default: module.AdminLayout,
  })),
)
const AdminProductsPage = lazy(() =>
  import('@/features/admin-products').then((module) => ({
    default: module.AdminProductsPage,
  })),
)
const ProductFormPage = lazy(() =>
  import('@/features/admin-products').then((module) => ({
    default: module.ProductFormPage,
  })),
)

function AdminLoader() {
  return (
    <Center mih="100vh">
      <Loader aria-label="Carregando a área administrativa" />
    </Center>
  )
}

// Rotas declarativas. O PublicLayout é uma layout route: o cabeçalho persiste
// e cada página entra no <Outlet />. A área administrativa tem o próprio
// layout, atrás do RequireAuth.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to={paths.products} replace />} />
        <Route path={paths.products} element={<ProductsPage />} />
        <Route path={paths.productPattern} element={<ProductDetailsPage />} />
        <Route path={paths.cart} element={<CartPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route
          path={paths.admin}
          element={
            <Suspense fallback={<AdminLoader />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={<Navigate to={paths.adminProducts} replace />}
          />
          <Route path={paths.adminProducts} element={<AdminProductsPage />} />
          <Route path={paths.adminProductNew} element={<ProductFormPage />} />
          <Route
            path={paths.adminProductEditPattern}
            element={<ProductFormPage />}
          />
          <Route path={`${paths.admin}/*`} element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
