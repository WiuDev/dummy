import { describe, expect, it } from 'vitest'
import { productFormSchema } from '@/schemas/admin'
import { lampFields, mascaraAdmin } from '@/test/admin'
import {
  emptyProductForm,
  toFormValues,
  toProductFields,
} from './product-form-values'

describe('valores do formulário de produto', () => {
  it('o cadastro começa vazio, com o desconto em zero', () => {
    expect(emptyProductForm()).toMatchObject({
      title: '',
      category: null,
      price: '',
      discountPercentage: 0,
      tags: [],
    })
  })

  it('a edição preenche o formulário com o produto', () => {
    const { id: _id, ...fields } = mascaraAdmin
    const values = toFormValues(mascaraAdmin)

    expect(values).toMatchObject({ ...fields })
    expect(toProductFields(productFormSchema.parse(values))).toEqual(fields)
  })

  it('marca e imagem vazias ficam ausentes no produto', () => {
    const values = toFormValues({
      ...lampFields,
      id: 10_000,
      brand: undefined,
      thumbnail: undefined,
    })

    expect(values).toMatchObject({ brand: '', thumbnail: '' })
    expect(toProductFields(productFormSchema.parse(values))).toMatchObject({
      brand: undefined,
      thumbnail: undefined,
    })
  })
})
