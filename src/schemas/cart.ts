import { z } from 'zod'
// Com extensão: o mock do E2E também importa este schema, e o tsconfig.node.json
// usa nodenext, que exige a extensão nos imports relativos.
import { productSchema } from './product.ts'

// Item do carrinho salvo no navegador: os dados do produto quando ele entrou no
// carrinho e a quantidade, que nunca passa do estoque.
export const cartItemSchema = productSchema
  .pick({
    id: true,
    title: true,
    price: true,
    discountPercentage: true,
    stock: true,
    thumbnail: true,
  })
  .extend({ quantity: z.number().int().positive() })
  .refine((item) => item.quantity <= item.stock, {
    message: 'A quantidade passa do estoque.',
  })

// Carrinho salvo (chave dummy:cart:v1), sem produto repetido.
export const storedCartSchema = z.object({
  version: z.literal(1),
  items: z
    .array(cartItemSchema)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      { message: 'Produto repetido no carrinho.' },
    ),
})

export const checkoutRequestSchema = z.object({
  userId: z.number().int().positive(),
  products: z
    .array(
      z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const cartItemResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  total: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  // A API arredonda os valores com desconto para inteiro.
  discountedPrice: z.number().nonnegative(),
  thumbnail: z.url(),
})

export const cartResponseSchema = z.object({
  id: z.number().int().positive(),
  products: z.array(cartItemResponseSchema),
  total: z.number().nonnegative(),
  discountedTotal: z.number().nonnegative(),
  userId: z.number().int().positive(),
  totalProducts: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
})

export type CartItem = z.infer<typeof cartItemSchema>
export type StoredCart = z.infer<typeof storedCartSchema>
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>
export type CartResponse = z.infer<typeof cartResponseSchema>
