import { Navigate, Route, Routes } from 'react-router'
import { PublicLayout } from '@/layouts/PublicLayout'
import { paths } from '@/lib/paths'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { UnderConstructionPage } from '@/routes/UnderConstructionPage'

// Rotas declarativas. O PublicLayout é uma layout route: o cabeçalho persiste
// e cada página entra no <Outlet />. As páginas do catálogo chegam no PR 3b;
// até lá, as rotas dele mostram a página em construção.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to={paths.products} replace />} />
        <Route path={paths.products} element={<UnderConstructionPage />} />
        <Route
          path={paths.productPattern}
          element={<UnderConstructionPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
