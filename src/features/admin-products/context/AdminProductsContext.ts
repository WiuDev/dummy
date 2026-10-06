import { createContext } from 'react'
import type {
  AdminOverlay,
  AdminProduct,
  DeletedProductEntry,
} from '@/schemas/admin'
import type { AdminFilters, AdminProductFields } from './overlay-state'

export interface AdminProductsContextValue {
  readonly overlay: AdminOverlay
  // Busca e página da tabela. Ficam aqui, e não na página, para sobreviverem à
  // ida ao formulário e à volta (G2).
  readonly filters: AdminFilters
  // Uma busca nova volta para a página 1.
  readonly setQuery: (query: string) => void
  readonly setPage: (page: number) => void
  readonly recordCreated: (fields: AdminProductFields) => void
  readonly recordUpdated: (product: AdminProduct) => void
  readonly recordDeleted: (entry: DeletedProductEntry) => void
  // "Descartar alterações simuladas".
  readonly discard: () => void
}

// Sem valor padrão: fora do AdminProductsProvider, o useAdminProducts lança um
// erro.
export const AdminProductsContext =
  createContext<AdminProductsContextValue | null>(null)
