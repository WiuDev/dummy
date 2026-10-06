import { describe, expect, it } from 'vitest'
import { EMPTY_ADMIN_OVERLAY } from '@/lib/admin-overlay'
import type { AdminOverlay } from '@/schemas/admin'
import productUpdateFixture from '@/test/fixtures/product-update.json'
import { lampFields, listPage, mascaraAdmin, phoneSearch } from '@/test/admin'
import {
  applyOverlay,
  findInOverlay,
  hasChanges,
  isDeletedInOverlay,
  isLocalId,
  matchesSearch,
  mergeServerEdit,
  recordCreated,
  recordDeleted,
  recordUpdated,
} from './overlay-state'

// Congela o overlay inteiro: qualquer mutação lançaria TypeError, porque os
// módulos ES rodam em modo estrito.
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
    Object.freeze(value)
  }
  return value
}

const PAGE_1 = { query: '', page: 1 }
const mascaraDeleted = {
  id: 1,
  title: mascaraAdmin.title,
  description: mascaraAdmin.description,
}

describe('applyOverlay', () => {
  it('sem alterações, mostra a página do servidor como está', () => {
    const view = applyOverlay(listPage, EMPTY_ADMIN_OVERLAY, PAGE_1)

    expect(view.rows.map((row) => [row.id, row.origin])).toEqual([
      [1, 'server'],
      [2, 'server'],
    ])
    expect(view.total).toBe(194)
    expect(view.pageCount).toBe(20)
  })

  it('tira os excluídos e os desconta do total, sem reequilibrar a página', () => {
    const overlay = recordDeleted(EMPTY_ADMIN_OVERLAY, mascaraDeleted)

    const view = applyOverlay(listPage, overlay, PAGE_1)

    expect(view.rows.map((row) => row.id)).toEqual([2])
    expect(view.total).toBe(193)
    expect(view.pageCount).toBe(20)
  })

  it('aplica as edições por cima da linha do servidor', () => {
    const overlay = recordUpdated(EMPTY_ADMIN_OVERLAY, {
      ...mascaraAdmin,
      price: 12.5,
      brand: undefined,
    })

    const [first] = applyOverlay(listPage, overlay, PAGE_1).rows

    expect(first).toMatchObject({
      id: 1,
      price: 12.5,
      brand: undefined,
      origin: 'edited',
    })
  })

  it('põe os criados no topo da página 1, do mais novo ao mais antigo, e os soma ao total', () => {
    const overlay = recordCreated(
      recordCreated(EMPTY_ADMIN_OVERLAY, lampFields),
      { ...lampFields, title: 'Abajur' },
    )

    const view = applyOverlay(listPage, overlay, PAGE_1)

    expect(view.rows.map((row) => [row.title, row.origin])).toEqual([
      ['Abajur', 'local'],
      ['Luminária de mesa', 'local'],
      ['Essence Mascara Lash Princess', 'server'],
      ['Eyeshadow Palette with Mirror', 'server'],
    ])
    expect(view.total).toBe(196)
  })

  it('fora da página 1, não mostra os criados, mas os conta no total', () => {
    const overlay = recordCreated(EMPTY_ADMIN_OVERLAY, lampFields)

    const view = applyOverlay(listPage, overlay, { query: '', page: 2 })

    expect(view.rows.every((row) => row.origin === 'server')).toBe(true)
    expect(view.total).toBe(195)
  })

  it('na busca, criados e excluídos contam pelo título ou pela descrição, como na API (G1)', () => {
    let overlay = recordCreated(EMPTY_ADMIN_OVERLAY, {
      ...lampFields,
      title: 'Capa para phone',
    })
    overlay = recordCreated(overlay, {
      ...lampFields,
      title: 'Suporte de mesa',
      description: 'Apoio para phone e tablet.',
    })
    overlay = recordCreated(overlay, lampFields)
    overlay = recordDeleted(overlay, {
      id: 121,
      title: 'iPhone 5s',
      description: 'The iPhone 5s is a classic smartphone.',
    })
    overlay = recordDeleted(overlay, mascaraDeleted)

    const view = applyOverlay(phoneSearch, overlay, {
      query: ' PHONE ',
      page: 1,
    })

    expect(
      view.rows.filter((row) => row.origin === 'local').map((row) => row.title),
    ).toEqual(['Suporte de mesa', 'Capa para phone'])
    expect(view.rows.some((row) => row.id === 121)).toBe(false)
    // 23 da busca, menos o excluído que casa, mais os dois criados que casam.
    expect(view.total).toBe(24)
  })

  it('sem resultado no servidor, os criados que casam ainda têm uma página', () => {
    const overlay = recordCreated(EMPTY_ADMIN_OVERLAY, lampFields)
    const empty = { products: [], total: 0, skip: 0, limit: 0 }

    const view = applyOverlay(empty, overlay, { query: 'luminária', page: 1 })

    expect(view.rows).toHaveLength(1)
    expect(view.total).toBe(1)
    expect(view.pageCount).toBe(1)
  })
})

describe('registro das alterações', () => {
  it('cria com ids locais a partir de 10000', () => {
    const once = recordCreated(EMPTY_ADMIN_OVERLAY, lampFields)
    const twice = recordCreated(once, { ...lampFields, title: 'Abajur' })

    expect(twice.created.map((item) => item.id)).toEqual([10_001, 10_000])
    expect(twice.nextLocalId).toBe(10_002)
    expect(isLocalId(10_000)).toBe(true)
    expect(isLocalId(194)).toBe(false)
  })

  it('edita o item local no lugar e guarda a edição do servidor por id', () => {
    const withLocal = recordCreated(EMPTY_ADMIN_OVERLAY, lampFields)
    const local = { ...lampFields, id: 10_000, price: 49.9 }

    const editedLocal = recordUpdated(withLocal, local)
    const editedServer = recordUpdated(editedLocal, mascaraAdmin)

    expect(editedLocal.created).toEqual([local])
    expect(editedLocal.updated).toEqual({})
    expect(editedServer.updated).toEqual({ '1': mascaraAdmin })
    expect(findInOverlay(editedServer, 10_000)).toEqual(local)
    expect(findInOverlay(editedServer, 1)).toEqual(mascaraAdmin)
    expect(findInOverlay(editedServer, 2)).toBeUndefined()
  })

  it('a exclusão do item local só o tira de created', () => {
    const withLocal = recordCreated(EMPTY_ADMIN_OVERLAY, lampFields)

    const overlay = recordDeleted(withLocal, {
      id: 10_000,
      title: lampFields.title,
      description: lampFields.description,
    })

    expect(overlay.created).toEqual([])
    expect(overlay.deleted).toEqual([])
    expect(hasChanges(overlay)).toBe(false)
  })

  it('a exclusão do item do servidor descarta a edição e não se repete', () => {
    const edited = recordUpdated(EMPTY_ADMIN_OVERLAY, mascaraAdmin)

    const overlay = recordDeleted(
      recordDeleted(edited, mascaraDeleted),
      mascaraDeleted,
    )

    expect(overlay.updated).toEqual({})
    expect(overlay.deleted).toEqual([mascaraDeleted])
    expect(isDeletedInOverlay(overlay, 1)).toBe(true)
    expect(isDeletedInOverlay(overlay, 2)).toBe(false)
    expect(hasChanges(overlay)).toBe(true)
  })

  it('a edição do servidor junta o produto completo, o formulário e os 11 campos do PUT', () => {
    const fields = { ...lampFields, title: 'Rímel Princesa', tags: ['rímel'] }

    const merged = mergeServerEdit(mascaraAdmin, fields, {
      ...productUpdateFixture,
      title: 'Rímel Princesa',
    })

    expect(merged).toEqual({
      ...fields,
      id: 1,
      // O PUT devolve o preço, o estoque e o resto dos 11 campos.
      price: 9.99,
      discountPercentage: 10.48,
      stock: 99,
      brand: 'Essence',
      category: 'beauty',
      description: productUpdateFixture.description,
      thumbnail: productUpdateFixture.thumbnail,
    })
  })
})

describe('matchesSearch', () => {
  it.each([
    ['LUMINÁRIA', true],
    ['led', true],
    ['  articulado ', true],
    ['', true],
    ['phone', false],
  ])('a busca %j casa: %s', (query, expected) => {
    expect(matchesSearch(lampFields, query)).toBe(expected === true)
  })
})

describe('imutabilidade', () => {
  it('nenhuma função altera o overlay recebido', () => {
    const overlay: AdminOverlay = deepFreeze(
      recordUpdated(
        recordCreated(EMPTY_ADMIN_OVERLAY, lampFields),
        mascaraAdmin,
      ),
    )
    const copy: unknown = JSON.parse(JSON.stringify(overlay))

    recordCreated(overlay, lampFields)
    recordUpdated(overlay, { ...mascaraAdmin, price: 1 })
    recordUpdated(overlay, { ...lampFields, id: 10_000, price: 1 })
    recordDeleted(overlay, mascaraDeleted)
    recordDeleted(overlay, { id: 10_000, title: '', description: '' })
    applyOverlay(listPage, overlay, PAGE_1)

    expect(overlay).toEqual(copy)
  })
})
