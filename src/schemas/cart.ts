import { z } from 'zod'

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

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>
export type CartResponse = z.infer<typeof cartResponseSchema>
