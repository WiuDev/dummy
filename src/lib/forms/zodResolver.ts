import { type FormErrors, schemaResolver } from '@mantine/form'
import type { z } from 'zod'

// Validação dos formulários do @mantine/form com Zod (D4). O schemaResolver
// nativo aceita o Standard Schema, que o Zod 4 implementa; o adaptador fixa o
// modo síncrono, que o useForm espera, e tipa os valores pelo schema.
export function zodResolver<S extends z.ZodType>(
  schema: S,
): (values: z.input<S>) => FormErrors {
  return schemaResolver(schema, { sync: true })
}
