import { z } from 'zod'
import { productSchema } from './product'

// Produto como a área administrativa o guarda no overlay: os campos da tabela
// e do formulário. Item criado aqui pode não ter imagem.
export const adminProductSchema = productSchema
  .pick({
    id: true,
    title: true,
    description: true,
    category: true,
    price: true,
    discountPercentage: true,
    stock: true,
    brand: true,
    tags: true,
  })
  .extend({ thumbnail: z.url().optional() })

// Exclusão de um item do servidor. O título e a descrição originais servem
// para descontar do total da busca pelo mesmo critério da API (G1).
export const deletedProductEntrySchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
})

// Overlay das alterações simuladas (chave dummy:admin-products:v1, no
// sessionStorage). Os ids locais começam em 10000.
export const storedAdminOverlaySchema = z.object({
  version: z.literal(1),
  created: z.array(adminProductSchema),
  updated: z.record(z.string(), adminProductSchema),
  deleted: z.array(deletedProductEntrySchema),
  nextLocalId: z.number().int().min(10_000),
})

export type AdminProduct = z.infer<typeof adminProductSchema>
export type DeletedProductEntry = z.infer<typeof deletedProductEntrySchema>
export type AdminOverlay = z.infer<typeof storedAdminOverlaySchema>
