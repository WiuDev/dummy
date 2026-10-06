import { use } from 'react'
import {
  AdminProductsContext,
  type AdminProductsContextValue,
} from '../context/AdminProductsContext'

// Acesso ao overlay e aos filtros da área administrativa. Fora do
// AdminProductsProvider, lança um erro.
export function useAdminProducts(): AdminProductsContextValue {
  const admin = use(AdminProductsContext)
  if (admin === null) {
    throw new Error(
      'useAdminProducts deve ser usado dentro de <AdminProductsProvider>.',
    )
  }
  return admin
}
