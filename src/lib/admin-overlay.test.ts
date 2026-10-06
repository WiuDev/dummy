import { describe, expect, it } from 'vitest'
import { lampFields } from '@/test/admin'
import {
  ADMIN_OVERLAY_KEY,
  clearAdminOverlay,
  EMPTY_ADMIN_OVERLAY,
  readAdminOverlay,
  writeAdminOverlay,
} from './admin-overlay'

const overlay = {
  ...EMPTY_ADMIN_OVERLAY,
  created: [{ ...lampFields, id: 10_000 }],
  nextLocalId: 10_001,
}

describe('admin-overlay', () => {
  it('sem overlay salvo, começa vazio', () => {
    expect(readAdminOverlay()).toEqual(EMPTY_ADMIN_OVERLAY)
  })

  it('grava no sessionStorage, e não no localStorage, e lê de volta', () => {
    writeAdminOverlay(overlay)

    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()
    expect(readAdminOverlay()).toEqual(overlay)
  })

  it('apaga o overlay', () => {
    writeAdminOverlay(overlay)

    clearAdminOverlay()

    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()
    expect(readAdminOverlay()).toEqual(EMPTY_ADMIN_OVERLAY)
  })

  it.each([
    ['de outra versão', { ...overlay, version: 2 }],
    ['com id local abaixo de 10000', { ...overlay, nextLocalId: 195 }],
    [
      'com imagem fora do formato de URL',
      {
        ...overlay,
        created: [{ ...lampFields, id: 10_000, thumbnail: 'imagem' }],
      },
    ],
  ])('descarta o overlay salvo %s', (_reason, stored) => {
    window.sessionStorage.setItem(ADMIN_OVERLAY_KEY, JSON.stringify(stored))

    expect(readAdminOverlay()).toEqual(EMPTY_ADMIN_OVERLAY)
    expect(window.sessionStorage.getItem(ADMIN_OVERLAY_KEY)).toBeNull()
  })
})
