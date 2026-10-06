import { z } from 'zod'

// Parâmetros do catálogo na URL (?q=&categoria=&pagina=), em pt-BR como as
// rotas (D36). Valores ausentes ou inválidos caem no padrão em vez de quebrar a
// página.
export const catalogSearchParamsSchema = z.object({
  q: z.string().trim().max(100).catch(''),
  categoria: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).catch(1),
})

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>

// Id de /produtos/:id: inteiro positivo ("abc", "0" e "1.5" são inválidos).
export const productIdParamSchema = z.coerce.number().int().positive()
