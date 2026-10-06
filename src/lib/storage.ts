import type { z } from 'zod'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

// Todas as chaves têm o prefixo "dummy:": no GitHub Pages, a origem
// wiudev.github.io é compartilhada entre os sites do mesmo usuário.
export type StorageKey = `dummy:${string}`

export interface StorageItem<T> {
  readonly key: StorageKey
  readonly read: () => T | null
  readonly write: (value: T) => void
  readonly remove: () => void
}

export interface StorageItemOptions<S extends z.ZodType> {
  readonly key: StorageKey
  readonly schema: S
  readonly storage?: () => StorageLike
}

export function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

const memoryStorage = createMemoryStorage()

// Usa o localStorage e, se o navegador bloquear o acesso (ex.: armazenamento
// desativado), guarda os dados em memória até a página ser fechada.
export function getBrowserStorage(): StorageLike {
  try {
    return window.localStorage
  } catch {
    return memoryStorage
  }
}

// Item versionado: tudo o que é lido passa pelo schema, e dados inválidos ou de
// outra versão são descartados. Falhas do storage (cota, modo privado) nunca
// derrubam a aplicação.
export function createStorageItem<S extends z.ZodType>({
  key,
  schema,
  storage = getBrowserStorage,
}: StorageItemOptions<S>): StorageItem<z.output<S>> {
  const remove = () => {
    try {
      storage().removeItem(key)
    } catch {
      // Sem acesso ao storage: não há o que remover.
    }
  }

  const read = (): z.output<S> | null => {
    let raw: string | null
    try {
      raw = storage().getItem(key)
    } catch {
      return null
    }
    if (raw === null) {
      return null
    }

    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      remove()
      return null
    }

    const result = schema.safeParse(data)
    if (!result.success) {
      remove()
      return null
    }
    return result.data
  }

  const write = (value: z.output<S>) => {
    try {
      storage().setItem(key, JSON.stringify(value))
    } catch {
      // Cota esgotada ou storage bloqueado: segue sem persistir.
    }
  }

  return { key, read, write, remove }
}

// Avisa quando a chave muda em outra aba (evento storage). Também dispara
// quando o storage inteiro é limpo (event.key === null).
export function onStorageKeyChange(
  key: StorageKey,
  listener: () => void,
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      listener()
    }
  }

  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener('storage', handleStorage)
  }
}
