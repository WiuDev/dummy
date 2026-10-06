import { useCallback } from 'react'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import type { AdminProduct } from '@/schemas/admin'
import { createProduct, updateProduct } from '@/services/products.service'
import {
  type AdminProductFields,
  isLocalId,
  mergeServerEdit,
} from '../context/overlay-state'
import { useAdminProducts } from './useAdminProducts'

// Escritas do admin, sempre registradas no overlay (D64). Cadastro: o POST
// valida o contrato, mas o item entra com o próximo id local. Edição de item
// local: só o overlay, sem a API, que responderia 404. Edição de item do
// servidor: o PUT, com a resposta mesclada ao produto completo. Desmontar no
// meio aborta a requisição, e nada é registrado.
export function useProductMutations() {
  const { recordCreated, recordUpdated } = useAdminProducts()

  const create = useAsyncAction(
    useCallback(
      async (signal: AbortSignal, fields: AdminProductFields) => {
        await createProduct(fields, { signal })
        recordCreated(fields)
      },
      [recordCreated],
    ),
  )

  const update = useAsyncAction(
    useCallback(
      async (
        signal: AbortSignal,
        base: AdminProduct,
        fields: AdminProductFields,
      ) => {
        if (isLocalId(base.id)) {
          recordUpdated({ ...base, ...fields })
          return
        }
        const response = await updateProduct(base.id, fields, { signal })
        recordUpdated(mergeServerEdit(base, fields, response))
      },
      [recordUpdated],
    ),
  )

  return { create, update }
}
