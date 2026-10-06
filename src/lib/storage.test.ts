import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  createMemoryStorage,
  createStorageItem,
  getBrowserStorage,
  onStorageKeyChange,
  type StorageLike,
} from './storage'

const counterSchema = z.object({ version: z.literal(1), count: z.number() })

function createCounterItem(storage?: () => StorageLike) {
  return createStorageItem({
    key: 'dummy:test-counter:v1',
    schema: counterSchema,
    ...(storage === undefined ? {} : { storage }),
  })
}

describe('createStorageItem', () => {
  it('grava e lê de volta um valor válido no localStorage', () => {
    const item = createCounterItem()

    item.write({ version: 1, count: 3 })

    expect(window.localStorage.getItem('dummy:test-counter:v1')).toBe(
      '{"version":1,"count":3}',
    )
    expect(item.read()).toEqual({ version: 1, count: 3 })
  })

  it('devolve null quando a chave não existe', () => {
    expect(createCounterItem().read()).toBeNull()
  })

  it('descarta JSON inválido', () => {
    window.localStorage.setItem('dummy:test-counter:v1', '{quebrado')

    expect(createCounterItem().read()).toBeNull()
    expect(window.localStorage.getItem('dummy:test-counter:v1')).toBeNull()
  })

  it('descarta dados de outra versão ou fora do schema', () => {
    window.localStorage.setItem(
      'dummy:test-counter:v1',
      JSON.stringify({ version: 2, count: 1 }),
    )

    expect(createCounterItem().read()).toBeNull()
    expect(window.localStorage.getItem('dummy:test-counter:v1')).toBeNull()
  })

  it('remove o valor salvo', () => {
    const item = createCounterItem()
    item.write({ version: 1, count: 1 })

    item.remove()

    expect(item.read()).toBeNull()
  })

  it('não lança quando o storage falha', () => {
    const failing: StorageLike = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new DOMException('cota esgotada', 'QuotaExceededError')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    }
    const item = createCounterItem(() => failing)

    expect(() => {
      item.write({ version: 1, count: 1 })
    }).not.toThrow()
    expect(item.read()).toBeNull()
    expect(() => {
      item.remove()
    }).not.toThrow()
  })

  it('funciona com um storage em memória', () => {
    const memory = createMemoryStorage()
    const item = createCounterItem(() => memory)

    item.write({ version: 1, count: 7 })

    expect(item.read()).toEqual({ version: 1, count: 7 })
    expect(window.localStorage.getItem('dummy:test-counter:v1')).toBeNull()
  })
})

describe('getBrowserStorage', () => {
  it('usa o localStorage quando ele está disponível', () => {
    expect(getBrowserStorage()).toBe(window.localStorage)
  })

  it('cai para a memória quando o navegador bloqueia o localStorage', () => {
    const blocked = vi
      .spyOn(window, 'localStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('acesso negado', 'SecurityError')
      })

    try {
      const storage = getBrowserStorage()
      storage.setItem('dummy:x', '1')

      expect(storage.getItem('dummy:x')).toBe('1')
      storage.removeItem('dummy:x')
      expect(storage.getItem('dummy:x')).toBeNull()
    } finally {
      // Restaura já aqui: o afterEach global usa o localStorage.
      blocked.mockRestore()
    }
  })
})

describe('onStorageKeyChange', () => {
  it('avisa só sobre a chave observada e sobre a limpeza do storage', () => {
    const listener = vi.fn()
    const unsubscribe = onStorageKeyChange('dummy:auth:v1', listener)

    window.dispatchEvent(new StorageEvent('storage', { key: 'dummy:auth:v1' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'outra-chave' }))
    window.dispatchEvent(new StorageEvent('storage', { key: null }))

    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('para de avisar depois do cleanup', () => {
    const listener = vi.fn()
    const unsubscribe = onStorageKeyChange('dummy:auth:v1', listener)

    unsubscribe()
    window.dispatchEvent(new StorageEvent('storage', { key: 'dummy:auth:v1' }))

    expect(listener).not.toHaveBeenCalled()
  })
})
