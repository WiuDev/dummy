import { useMemo } from 'react'
import { type AsyncTask, useAsync, type UseAsyncResult } from '@/hooks/useAsync'
import type { Product } from '@/schemas/product'
import { getProduct } from '@/services/products.service'

// Produto do detalhe. Com id null (id inválido na URL), fica ocioso e não faz
// requisição.
export function useProduct(id: number | null): UseAsyncResult<Product> {
  const task = useMemo<AsyncTask<Product> | null>(
    () => (id === null ? null : (signal) => getProduct(id, { signal })),
    [id],
  )
  return useAsync(task)
}
