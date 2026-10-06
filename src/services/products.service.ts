import {
  type Category,
  categoriesSchema,
  type DeletedProduct,
  deletedProductResponseSchema,
  type Product,
  type ProductInput,
  type ProductMutationResponse,
  productMutationResponseSchema,
  productSchema,
  type ProductsPage,
  productsPageSchema,
  productSummarySchema,
} from '@/schemas/product'
import { api, type RequestOptions } from './api'
import { parseResponse } from './parse-response'

export type ProductScope = 'public' | 'admin'

export interface ProductRequestOptions extends RequestOptions {
  // admin lê pelas rotas /auth/products, que exigem o Bearer.
  readonly scope?: ProductScope
}

export interface ListParams {
  readonly limit: number
  readonly skip: number
  readonly sortBy?: 'title' | 'price' | 'rating'
  readonly order?: 'asc' | 'desc'
}

// Campos do resumo, pedidos com select para as listagens ficarem leves. A API
// sempre devolve o id.
const SUMMARY_SELECT = Object.keys(productSummarySchema.shape)
  .filter((field) => field !== 'id')
  .join(',')

interface PageQuery extends ListParams {
  readonly q?: string
}

function productsPath(scope: ProductScope = 'public'): string {
  return scope === 'admin' ? '/auth/products' : '/products'
}

async function getPage(
  path: string,
  query: PageQuery,
  signal: AbortSignal | undefined,
): Promise<ProductsPage> {
  const { data } = await api.get<unknown>(path, {
    params: { ...query, select: SUMMARY_SELECT },
    signal,
  })
  return parseResponse(productsPageSchema, data, `GET ${path}`)
}

export function listProducts(
  params: ListParams,
  { scope, signal }: ProductRequestOptions = {},
): Promise<ProductsPage> {
  return getPage(productsPath(scope), params, signal)
}

export function searchProducts(
  query: string,
  params: ListParams,
  { scope, signal }: ProductRequestOptions = {},
): Promise<ProductsPage> {
  return getPage(
    `${productsPath(scope)}/search`,
    { q: query, ...params },
    signal,
  )
}

export function listProductsByCategory(
  slug: string,
  params: ListParams,
  { scope, signal }: ProductRequestOptions = {},
): Promise<ProductsPage> {
  return getPage(
    `${productsPath(scope)}/category/${encodeURIComponent(slug)}`,
    params,
    signal,
  )
}

export async function getProduct(
  id: number,
  { scope, signal }: ProductRequestOptions = {},
): Promise<Product> {
  const path = `${productsPath(scope)}/${id}`
  const { data } = await api.get<unknown>(path, { signal })
  return parseResponse(productSchema, data, `GET ${path}`)
}

export async function getCategories({ signal }: RequestOptions = {}): Promise<
  Category[]
> {
  const path = '/products/categories'
  const { data } = await api.get<unknown>(path, { signal })
  return parseResponse(categoriesSchema, data, `GET ${path}`)
}

// As escritas sempre passam pelas rotas /auth. A DummyJSON só as simula: a
// resposta tem o formato certo, mas nada é gravado.
export async function createProduct(
  input: ProductInput,
  { signal }: RequestOptions = {},
): Promise<ProductMutationResponse> {
  const path = '/auth/products/add'
  const { data } = await api.post<unknown>(path, input, { signal })
  return parseResponse(productMutationResponseSchema, data, `POST ${path}`)
}

export async function updateProduct(
  id: number,
  input: ProductInput,
  { signal }: RequestOptions = {},
): Promise<ProductMutationResponse> {
  const path = `/auth/products/${id}`
  const { data } = await api.put<unknown>(path, input, { signal })
  return parseResponse(productMutationResponseSchema, data, `PUT ${path}`)
}

export async function deleteProduct(
  id: number,
  { signal }: RequestOptions = {},
): Promise<DeletedProduct> {
  const path = `/auth/products/${id}`
  const { data } = await api.delete<unknown>(path, { signal })
  return parseResponse(deletedProductResponseSchema, data, `DELETE ${path}`)
}
