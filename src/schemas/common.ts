import { z } from 'zod'

// Corpo das respostas de erro da DummyJSON (ex.: 400, 401, 404).
export const apiErrorBodySchema = z.object({
  message: z.string().min(1),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
