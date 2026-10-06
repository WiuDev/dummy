import { z } from 'zod'

// Fica fora de admin.ts, que o AuthProvider importa para limpar o overlay:
// assim o formulário só entra no chunk do admin (D66).

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

export type ProductFormData = z.output<typeof productFormSchema>
