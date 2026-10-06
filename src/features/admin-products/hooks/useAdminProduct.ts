import { useMemo } from 'react'
import { useAsync } from '@/hooks/useAsync'
import type { AppError } from '@/lib/errors'
import type { AdminProduct } from '@/schemas/admin'
import { getProduct } from '@/services/products.service'
import {
  findInOverlay,
  isDeletedInOverlay,
  isLocalId,
  toAdminProduct,
} from '../context/overlay-state'
import { useAdminProducts } from './useAdminProducts'

export type AdminProductLookup =
  | { readonly status: 'loading' }
  | { readonly status: 'found'; readonly product: AdminProduct }
  | { readonly status: 'not_found' }
  | {
      readonly status: 'error'
      readonly error: AppError
      readonly reload: () => void
    }

// Produto da edição: o do overlay (criado aqui ou já editado) ou o do servidor,
// pelo GET /auth/products/:id. Id inválido, item local que não existe mais,
// excluído no overlay ou 404 da API: não encontrado.
export function useAdminProduct(id: number | null): AdminProductLookup {
  const { overlay } = useAdminProducts()
  const fromOverlay = id === null ? undefined : findInOverlay(overlay, id)
  const fetchId =
    id !== null &&
    fromOverlay === undefined &&
    !isLocalId(id) &&
    !isDeletedInOverlay(overlay, id)
      ? id
      : null
  const task = useMemo(
    () =>
      fetchId === null
        ? null
        : (signal: AbortSignal) =>
            getProduct(fetchId, { scope: 'admin', signal }),
    [fetchId],
  )
  const remote = useAsync(task)

  if (fromOverlay !== undefined) {
    return { status: 'found', product: fromOverlay }
  }
  if (fetchId === null) {
    return { status: 'not_found' }
  }
  switch (remote.status) {
    case 'idle':
    case 'loading':
      return { status: 'loading' }
    case 'error':
      return remote.error.kind === 'not_found'
        ? { status: 'not_found' }
        : { status: 'error', error: remote.error, reload: remote.reload }
    case 'success':
      return { status: 'found', product: toAdminProduct(remote.data) }
  }
}
