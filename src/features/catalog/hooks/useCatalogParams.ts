import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { catalogSearchParamsSchema } from '@/schemas/catalog'

export interface CatalogParams {
  readonly query: string
  readonly category: string | undefined
  readonly page: number
}

export interface UseCatalogParamsResult {
  readonly params: CatalogParams
  // replace, para a digitação não encher o histórico; volta para a página 1.
  readonly setQuery: (query: string) => void
  // push; volta para a página 1.
  readonly setCategory: (category: string | undefined) => void
  // push.
  readonly setPage: (page: number) => void
  // push: o catálogo sem filtros.
  readonly clearFilters: () => void
  // Query string ("?…" ou vazia) dos parâmetros atuais com as mudanças pedidas,
  // sem navegar: serve para links e para normalizar a URL com <Navigate replace>.
  readonly searchFor: (changes: Partial<CatalogParams>) => string
}

function parseCatalogParams(searchParams: URLSearchParams): CatalogParams {
  const { q, categoria, pagina } = catalogSearchParamsSchema.parse({
    q: searchParams.get('q') ?? undefined,
    categoria: searchParams.get('categoria') ?? undefined,
    pagina: searchParams.get('pagina') ?? undefined,
  })
  return { query: q, category: categoria, page: pagina }
}

// Só grava o que difere do padrão: sem filtros e na página 1, fica /produtos.
function toSearchParams({
  query,
  category,
  page,
}: CatalogParams): URLSearchParams {
  const next = new URLSearchParams()
  if (query !== '') {
    next.set('q', query)
  }
  if (category !== undefined) {
    next.set('categoria', category)
  }
  if (page > 1) {
    next.set('pagina', String(page))
  }
  return next
}

// Estado do catálogo guardado na URL (?q=&categoria=&pagina=), validado com
// Zod. Mudar a busca ou a categoria volta para a página 1. O resultado só muda
// quando a URL muda.
export function useCatalogParams(): UseCatalogParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()

  return useMemo(() => {
    const params = parseCatalogParams(searchParams)
    const update = (next: CatalogParams, replace: boolean): void => {
      setSearchParams(toSearchParams(next), { replace })
    }

    return {
      params,
      setQuery: (query) => {
        update({ ...params, query: query.trim(), page: 1 }, true)
      },
      setCategory: (category) => {
        update({ ...params, category, page: 1 }, false)
      },
      setPage: (page) => {
        update({ ...params, page }, false)
      },
      clearFilters: () => {
        update({ query: '', category: undefined, page: 1 }, false)
      },
      searchFor: (changes) => {
        const search = toSearchParams({ ...params, ...changes }).toString()
        return search === '' ? '' : `?${search}`
      },
    }
  }, [searchParams, setSearchParams])
}
