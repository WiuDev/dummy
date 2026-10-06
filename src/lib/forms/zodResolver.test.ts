import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodResolver } from './zodResolver'

const schema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  address: z.object({ city: z.string().min(2, 'Cidade curta demais.') }),
})

describe('zodResolver', () => {
  it('sem erros, devolve um objeto vazio', () => {
    const validate = zodResolver(schema)

    expect(validate({ name: 'Ana', address: { city: 'Recife' } })).toEqual({})
  })

  it('devolve a mensagem do schema no caminho de cada campo', () => {
    const validate = zodResolver(schema)

    expect(validate({ name: '', address: { city: 'R' } })).toEqual({
      name: 'Informe o nome.',
      'address.city': 'Cidade curta demais.',
    })
  })
})
