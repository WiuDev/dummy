import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  clearAdminOverlay,
  EMPTY_ADMIN_OVERLAY,
  readAdminOverlay,
  writeAdminOverlay,
} from '@/lib/admin-overlay'
import type {
  AdminOverlay,
  AdminProduct,
  DeletedProductEntry,
} from '@/schemas/admin'
import {
  AdminProductsContext,
  type AdminProductsContextValue,
} from './AdminProductsContext'
import {
  type AdminFilters,
  type AdminProductFields,
  hasChanges,
  recordCreated,
  recordDeleted,
  recordUpdated,
} from './overlay-state'

export interface AdminProductsProviderProps {
  readonly children: ReactNode
}

const INITIAL_FILTERS: AdminFilters = { query: '', page: 1 }

// Estado da área administrativa (D5, D64): o overlay das alterações simuladas,
// em useState com as funções puras de overlay-state.ts (A3), e os filtros da
// tabela, num objeto atualizado com spread (G2). Montado só no AdminLayout.
export function AdminProductsProvider({
  children,
}: AdminProductsProviderProps) {
  // Hidratação síncrona: o overlay salvo na aba já vale no primeiro render.
  const [overlay, setOverlay] = useState<AdminOverlay>(readAdminOverlay)
  const [filters, setFilters] = useState<AdminFilters>(INITIAL_FILTERS)

  // Grava cada mudança; sem alterações, não deixa nada no storage.
  useEffect(() => {
    if (hasChanges(overlay)) {
      writeAdminOverlay(overlay)
    } else {
      clearAdminOverlay()
    }
  }, [overlay])

  const setQuery = useCallback((query: string) => {
    setFilters((current) =>
      current.query === query ? current : { ...current, query, page: 1 },
    )
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((current) => ({ ...current, page }))
  }, [])

  const created = useCallback((fields: AdminProductFields) => {
    setOverlay((current) => recordCreated(current, fields))
  }, [])

  const updated = useCallback((product: AdminProduct) => {
    setOverlay((current) => recordUpdated(current, product))
  }, [])

  const deleted = useCallback((entry: DeletedProductEntry) => {
    setOverlay((current) => recordDeleted(current, entry))
  }, [])

  const discard = useCallback(() => {
    setOverlay(EMPTY_ADMIN_OVERLAY)
  }, [])

  const value = useMemo<AdminProductsContextValue>(
    () => ({
      overlay,
      filters,
      setQuery,
      setPage,
      recordCreated: created,
      recordUpdated: updated,
      recordDeleted: deleted,
      discard,
    }),
    [overlay, filters, setQuery, setPage, created, updated, deleted, discard],
  )

  return <AdminProductsContext value={value}>{children}</AdminProductsContext>
}
