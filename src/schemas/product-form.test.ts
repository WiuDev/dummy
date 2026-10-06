import { describe, expect, it } from 'vitest'
import { productFormSchema, type ProductFormValues } from './product-form'

const valid: ProductFormValues = {
  title: 'Luminária de mesa',
  description: 'Luminária de LED com braço articulado.',
  category: 'home-decoration',
  brand: '',
  price: 59.9,
  discountPercentage: 5,
  stock: 12,
  thumbnail: 'https://cdn.dummyjson.com/luminaria.webp',
  tags: ['iluminação'],
}

function messagesFor(values: Partial<ProductFormValues>): string[] {
  const result = productFormSchema.safeParse({ ...valid, ...values })
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('formulário de produto', () => {
  it('aceita um produto válido, sem os espaços nas pontas', () => {
    expect(
      productFormSchema.parse({ ...valid, title: '  Luminária de mesa  ' }),
    ).toEqual(valid)
  })

  it('exige título, descrição, categoria, preço e estoque, em pt-BR', () => {
    expect(
      messagesFor({
        title: 'ab',
        description: 'curta',
        category: null,
        price: '',
        stock: '',
      }),
    ).toEqual([
      'Use de 3 a 100 caracteres.',
      'Use de 10 a 1000 caracteres.',
      'Escolha a categoria.',
      'Informe o preço.',
      'Informe o estoque.',
    ])
  })

  it.each([
    [{ price: 0 }, 'O preço precisa ser maior que zero.'],
    [{ price: 100_000.01 }, 'O preço vai até US$ 100.000.'],
    [{ price: 9.999 }, 'Use no máximo 2 casas decimais.'],
    [{ discountPercentage: 101 }, 'O desconto vai de 0 a 100%.'],
    [{ stock: 1.5 }, 'Use um número inteiro.'],
    [{ stock: -1 }, 'O estoque não pode ser negativo.'],
    [{ brand: 'x'.repeat(51) }, 'Use até 50 caracteres.'],
    [
      { tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) },
      'Use até 10 tags.',
    ],
  ])('recusa %j', (values, message) => {
    expect(messagesFor(values)).toEqual([message])
  })

  it.each([
    'http://cdn.dummyjson.com/luminaria.webp',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'imagem.webp',
  ])('recusa a imagem %j: só https', (thumbnail) => {
    expect(messagesFor({ thumbnail })).toEqual([
      'Use um endereço que comece com https://.',
    ])
  })

  it('aceita a imagem vazia e o desconto zero', () => {
    expect(messagesFor({ thumbnail: '', discountPercentage: 0 })).toEqual([])
  })
})
