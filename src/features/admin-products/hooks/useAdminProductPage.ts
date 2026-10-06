import { useCallback } from 'react'
import { useAsync, type UseAsyncResult } from '@/hooks/useAsync'
import type { ProductsPage } from '@/schemas/product'
import { listProducts, searchProducts } from '@/services/products.service'
import { ADMIN_PAGE_SIZE, type AdminFilters } from '../context/overlay-state'

// Página do servidor para a busca e a página da tabela, pelas rotas
// /auth/products, com o Bearer (D28). O overlay é aplicado depois, na página.
export function useAdminProductPage({
  query,
  page,
}: AdminFilters): UseAsyncResult<ProductsPage> {
  const task = useCallback(
    (signal: AbortSignal) => {
      const params = {
        limit: ADMIN_PAGE_SIZE,
        skip: (page - 1) * ADMIN_PAGE_SIZE,
      }
      const term = query.trim()
      return term === ''
        ? listProducts(params, { scope: 'admin', signal })
        : searchProducts(term, params, { scope: 'admin', signal })
    },
    [query, page],
  )
  return useAsync(task)
}
