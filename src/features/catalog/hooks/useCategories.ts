import { type AsyncTask, useAsync, type UseAsyncResult } from '@/hooks/useAsync'
import type { Category } from '@/schemas/product'
import { getCategories } from '@/services/products.service'

// Definida fora do componente: é a mesma tarefa em todo render, então o
// useAsync só carrega as categorias uma vez por montagem.
const loadCategories: AsyncTask<Category[]> = (signal) =>
  getCategories({ signal })

export function useCategories(): UseAsyncResult<Category[]> {
  return useAsync(loadCategories)
}
