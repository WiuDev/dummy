import { LOCAL_ID_START } from '@/lib/admin-overlay'
import type {
  AdminOverlay,
  AdminProduct,
  DeletedProductEntry,
} from '@/schemas/admin'
import type {
  ProductMutationResponse,
  ProductsPage,
  ProductSummary,
} from '@/schemas/product'

// Funções puras do overlay de alterações simuladas (D64). Como as do carrinho
// (D41), nunca alteram o que recebem: devolvem objetos e arrays novos, com
// spread (A3).

export const ADMIN_PAGE_SIZE = 10

export interface AdminFilters {
  readonly query: string
  readonly page: number
}

// Dados do produto que o formulário edita: tudo menos o id.
export type AdminProductFields = Omit<AdminProduct, 'id'>

// Origem da linha: do servidor, do servidor com edição simulada ou criada aqui.
export type AdminRowOrigin = 'server' | 'edited' | 'local'

export interface AdminProductRow {
  readonly id: number
  readonly title: string
  readonly category: string
  readonly price: number
  readonly discountPercentage: number
  readonly stock: number
  readonly brand?: string | undefined
  readonly thumbnail?: string | undefined
  readonly origin: AdminRowOrigin
}

export interface AdminProductsView {
  readonly rows: readonly AdminProductRow[]
  // Quantos produtos a busca encontra, já com as alterações simuladas.
  readonly total: number
  // Páginas do servidor: os itens locais entram na página 1.
  readonly pageCount: number
}

export function isLocalId(id: number): boolean {
  return id >= LOCAL_ID_START
}

// Como a busca da API: o título ou a descrição contém o termo, sem diferenciar
// maiúsculas (G1). Sem termo, tudo casa.
export function matchesSearch(
  item: { readonly title: string; readonly description: string },
  query: string,
): boolean {
  const term = query.trim().toLowerCase()
  return (
    term === '' ||
    item.title.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term)
  )
}

function rowFields(product: AdminProduct | ProductSummary) {
  return {
    id: product.id,
    title: product.title,
    category: product.category,
    price: product.price,
    discountPercentage: product.discountPercentage,
    stock: product.stock,
    brand: product.brand,
    thumbnail: product.thumbnail,
  }
}

// Página do servidor com as alterações simuladas: sem os excluídos, com as
// edições por cima das linhas do servidor e, na página 1, os criados que casam
// com a busca no topo, do mais novo ao mais antigo. O total desconta os
// excluídos e soma os criados que casam com a busca, pelo critério da API. A
// página não se reequilibra: sem um excluído, ela mostra um item a menos.
export function applyOverlay(
  page: ProductsPage,
  overlay: AdminOverlay,
  filters: AdminFilters,
): AdminProductsView {
  const deletedIds = new Set(overlay.deleted.map((entry) => entry.id))
  const serverRows = page.products
    .filter((product) => !deletedIds.has(product.id))
    .map((product): AdminProductRow => {
      const edited = overlay.updated[String(product.id)]
      return edited === undefined
        ? { ...rowFields(product), origin: 'server' }
        : { ...rowFields(product), ...rowFields(edited), origin: 'edited' }
    })
  const created = overlay.created.filter((product) =>
    matchesSearch(product, filters.query),
  )
  const localRows =
    filters.page === 1
      ? created.map((product): AdminProductRow => ({
          ...rowFields(product),
          origin: 'local',
        }))
      : []
  const deletedMatching = overlay.deleted.filter((entry) =>
    matchesSearch(entry, filters.query),
  ).length
  const serverPages = Math.ceil(page.total / ADMIN_PAGE_SIZE)

  return {
    rows: [...localRows, ...serverRows],
    total: Math.max(page.total - deletedMatching, 0) + created.length,
    pageCount: serverPages === 0 && created.length > 0 ? 1 : serverPages,
  }
}

// Produto do overlay com o id dado: criado aqui ou do servidor já editado.
export function findInOverlay(
  overlay: AdminOverlay,
  id: number,
): AdminProduct | undefined {
  return isLocalId(id)
    ? overlay.created.find((product) => product.id === id)
    : overlay.updated[String(id)]
}

export function isDeletedInOverlay(overlay: AdminOverlay, id: number): boolean {
  return overlay.deleted.some((entry) => entry.id === id)
}

export function hasChanges(overlay: AdminOverlay): boolean {
  return (
    overlay.created.length > 0 ||
    Object.keys(overlay.updated).length > 0 ||
    overlay.deleted.length > 0
  )
}

// Criação: o item entra no topo com o próximo id local.
export function recordCreated(
  overlay: AdminOverlay,
  fields: AdminProductFields,
): AdminOverlay {
  return {
    ...overlay,
    created: [{ ...fields, id: overlay.nextLocalId }, ...overlay.created],
    nextLocalId: overlay.nextLocalId + 1,
  }
}

// Edição: o item local é trocado no lugar, sem a API; o do servidor fica em
// updated, por id.
export function recordUpdated(
  overlay: AdminOverlay,
  product: AdminProduct,
): AdminOverlay {
  if (isLocalId(product.id)) {
    return {
      ...overlay,
      created: overlay.created.map((item) =>
        item.id === product.id ? { ...item, ...product } : item,
      ),
    }
  }
  return {
    ...overlay,
    updated: { ...overlay.updated, [String(product.id)]: product },
  }
}

// Exclusão: o item local sai de created; o do servidor sai de updated e entra
// em deleted, com o título e a descrição originais.
export function recordDeleted(
  overlay: AdminOverlay,
  entry: DeletedProductEntry,
): AdminOverlay {
  if (isLocalId(entry.id)) {
    return {
      ...overlay,
      created: overlay.created.filter((item) => item.id !== entry.id),
    }
  }
  return {
    ...overlay,
    updated: Object.fromEntries(
      Object.entries(overlay.updated).filter(([id]) => id !== String(entry.id)),
    ),
    deleted: [...overlay.deleted.filter((item) => item.id !== entry.id), entry],
  }
}

// Edição de item do servidor: o PUT da API devolve só 11 campos, então o
// resultado é o produto completo, com os campos do formulário e, por cima, os
// que a resposta trouxe.
export function mergeServerEdit(
  base: AdminProduct,
  fields: AdminProductFields,
  response: ProductMutationResponse,
): AdminProduct {
  const edited = { ...base, ...fields }
  return {
    ...edited,
    id: base.id,
    title: response.title ?? edited.title,
    description: response.description ?? edited.description,
    category: response.category ?? edited.category,
    price: response.price ?? edited.price,
    discountPercentage:
      response.discountPercentage ?? edited.discountPercentage,
    stock: response.stock ?? edited.stock,
    brand: response.brand ?? edited.brand,
    tags: response.tags ?? edited.tags,
    thumbnail: response.thumbnail ?? edited.thumbnail,
  }
}
