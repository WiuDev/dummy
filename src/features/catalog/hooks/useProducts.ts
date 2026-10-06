import { useCallback } from 'react'
import { type AsyncTask, useAsync, type UseAsyncResult } from '@/hooks/useAsync'
import type { ProductSummary } from '@/schemas/product'
import {
  listProducts,
  listProductsByCategory,
  searchProducts,
} from '@/services/products.service'
import type { CatalogParams } from './useCatalogParams'

export const CATALOG_PAGE_SIZE = 12

export type CatalogMode = 'all' | 'search' | 'category' | 'combined'

export interface CatalogPage {
  readonly products: readonly ProductSummary[]
  readonly total: number
  readonly page: number
  // Zero quando não há resultados.
  readonly pageCount: number
  readonly mode: CatalogMode
}

function toCatalogPage(
  products: readonly ProductSummary[],
  total: number,
  page: number,
  mode: CatalogMode,
): CatalogPage {
  return {
    products,
    total,
    page,
    pageCount: Math.ceil(total / CATALOG_PAGE_SIZE),
    mode,
  }
}

async function loadCatalogPage(
  { query, category, page }: CatalogParams,
  signal: AbortSignal,
): Promise<CatalogPage> {
  const skip = (page - 1) * CATALOG_PAGE_SIZE
  const pageParams = { limit: CATALOG_PAGE_SIZE, skip }

  if (query !== '' && category !== undefined) {
    // A API não combina busca e categoria (D6): traz toda a busca (limit=0) e
    // filtra e pagina no cliente.
    const results = await searchProducts(
      query,
      { limit: 0, skip: 0 },
      { signal },
    )
    const matching = results.products.filter(
      (product) => product.category === category,
    )
    return toCatalogPage(
      matching.slice(skip, skip + CATALOG_PAGE_SIZE),
      matching.length,
      page,
      'combined',
    )
  }

  if (query !== '') {
    const result = await searchProducts(query, pageParams, { signal })
    return toCatalogPage(result.products, result.total, page, 'search')
  }

  if (category !== undefined) {
    const result = await listProductsByCategory(category, pageParams, {
      signal,
    })
    return toCatalogPage(result.products, result.total, page, 'category')
  }

  const result = await listProducts(pageParams, { signal })
  return toCatalogPage(result.products, result.total, page, 'all')
}

// Página do catálogo para os parâmetros da URL: lista, busca ou categoria
// paginadas no servidor, ou o modo combinado paginado no cliente. A tarefa só
// muda quando busca, categoria ou página mudam, e o useAsync aborta a anterior.
export function useProducts({
  query,
  category,
  page,
}: CatalogParams): UseAsyncResult<CatalogPage> {
  const task = useCallback<AsyncTask<CatalogPage>>(
    (signal) => loadCatalogPage({ query, category, page }, signal),
    [query, category, page],
  )
  return useAsync(task)
}
