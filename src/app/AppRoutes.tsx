import { Route, Routes } from 'react-router'
import { UnderConstructionPage } from '@/routes/UnderConstructionPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<UnderConstructionPage />} />
    </Routes>
  )
}
