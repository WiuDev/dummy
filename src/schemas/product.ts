import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  date: z.iso.datetime(),
  reviewerName: z.string(),
  reviewerEmail: z.email(),
})

export const productSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  rating: z.number().min(0).max(5),
  stock: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  // Ausente em parte do catálogo (ex.: alimentos).
  brand: z.string().optional(),
  sku: z.string(),
  weight: z.number().nonnegative(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
  }),
  warrantyInformation: z.string(),
  shippingInformation: z.string(),
  availabilityStatus: z.string(),
  reviews: z.array(reviewSchema),
  returnPolicy: z.string(),
  minimumOrderQuantity: z.number().int().positive(),
  meta: z.object({
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    barcode: z.string(),
    qrCode: z.url(),
  }),
  images: z.array(z.url()),
  thumbnail: z.url(),
})

// Campos das listagens, pedidos à API com o parâmetro `select`.
export const productSummarySchema = productSchema.pick({
  id: true,
  title: true,
  price: true,
  discountPercentage: true,
  rating: true,
  stock: true,
  thumbnail: true,
  category: true,
  brand: true,
  availabilityStatus: true,
})

export const productsPageSchema = z.object({
  products: z.array(productSummarySchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  // Quantidade devolvida, que pode ser menor que a pedida (última página).
  limit: z.number().int().nonnegative(),
})

export const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.url(),
})

export const categoriesSchema = z.array(categorySchema)

// Campos aceitos no cadastro e na edição. A API não valida nada; a validação
// de verdade fica no formulário do admin.
export const productInputSchema = productSchema
  .pick({
    title: true,
    description: true,
    price: true,
    discountPercentage: true,
    stock: true,
    brand: true,
    category: true,
    thumbnail: true,
    tags: true,
  })
  .partial()

// POST devolve só os campos enviados (com id 195) e PUT devolve 11 campos.
export const productMutationResponseSchema = productSchema.partial().extend({
  id: z.number().int().positive(),
})

export const deletedProductResponseSchema = productSchema.extend({
  isDeleted: z.literal(true),
  deletedOn: z.iso.datetime(),
})

export type Review = z.infer<typeof reviewSchema>
export type Product = z.infer<typeof productSchema>
export type ProductSummary = z.infer<typeof productSummarySchema>
export type ProductsPage = z.infer<typeof productsPageSchema>
export type Category = z.infer<typeof categorySchema>
export type ProductInput = z.infer<typeof productInputSchema>
export type ProductMutationResponse = z.infer<
  typeof productMutationResponseSchema
>
export type DeletedProduct = z.infer<typeof deletedProductResponseSchema>
