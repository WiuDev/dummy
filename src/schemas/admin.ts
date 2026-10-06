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

// O NumberInput entrega '' com o campo vazio; aqui isso vira "não informado".
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

const httpsUrlSchema = z.url({ protocol: /^https$/ })

// Formulário de produto do admin (D67), com as mensagens em pt-BR campo a
// campo. A imagem é opcional, mas, se vier, só com https: sem conteúdo misto
// nem esquemas como javascript: e data:.
export const productFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use de 3 a 100 caracteres.')
    .max(100, 'Use de 3 a 100 caracteres.'),
  description: z
    .string()
    .trim()
    .min(10, 'Use de 10 a 1000 caracteres.')
    .max(1000, 'Use de 10 a 1000 caracteres.'),
  // O Select entrega null quando nada foi escolhido.
  category: z.preprocess(
    (value) => (value === null ? '' : value),
    z.string().min(1, 'Escolha a categoria.'),
  ),
  brand: z.string().trim().max(50, 'Use até 50 caracteres.'),
  price: z.preprocess(
    emptyToUndefined,
    z
      .number({ error: 'Informe o preço.' })
      .positive('O preço precisa ser maior que zero.')
      .max(100_000, 'O preço vai até US$ 100.000.')
      .multipleOf(0.01, 'Use no máximo 2 casas decimais.'),
  ),
  discountPercentage: z.preprocess(
    emptyToUndefined,
    z
      .number({ error: 'Informe o desconto.' })
      .min(0, 'O desconto vai de 0 a 100%.')
      .max(100, 'O desconto vai de 0 a 100%.'),
  ),
  stock: z.preprocess(
    emptyToUndefined,
    z
      .number({ error: 'Informe o estoque.' })
      .int('Use um número inteiro.')
      .min(0, 'O estoque não pode ser negativo.')
      .max(100_000, 'O estoque vai até 100.000.'),
  ),
  thumbnail: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || httpsUrlSchema.safeParse(value).success,
      'Use um endereço que comece com https://.',
    ),
  tags: z
    .array(z.string().trim().min(1).max(30, 'Cada tag tem até 30 caracteres.'))
    .max(10, 'Use até 10 tags.'),
})

// Valores do formulário como os campos os entregam (o NumberInput dá '' quando
// vazio, e o Select, null). Sem readonly: é o @mantine/form que os atualiza.
export interface ProductFormValues {
  title: string
  description: string
  category: string | null
  brand: string
  price: number | string
  discountPercentage: number | string
  stock: number | string
  thumbnail: string
  tags: string[]
}

export type AdminProduct = z.infer<typeof adminProductSchema>
export type ProductFormData = z.output<typeof productFormSchema>
export type DeletedProductEntry = z.infer<typeof deletedProductEntrySchema>
export type AdminOverlay = z.infer<typeof storedAdminOverlaySchema>
