import { type AdminOverlay, storedAdminOverlaySchema } from '@/schemas/admin'
import { createStorageItem, getSessionStorage } from './storage'

export const ADMIN_OVERLAY_KEY = 'dummy:admin-products:v1'

// Primeiro id dos produtos criados no admin. A API vai até 194, e o POST
// sempre devolve 195: os ids locais nunca colidem com os dela.
export const LOCAL_ID_START = 10_000

export const EMPTY_ADMIN_OVERLAY: AdminOverlay = {
  version: 1,
  created: [],
  updated: {},
  deleted: [],
  nextLocalId: LOCAL_ID_START,
}

// O overlay vale só na aba (sessionStorage) e some quando a sessão termina
// (A4). Aqui, e não na feature do admin, para o AuthProvider poder apagá-lo
// mesmo com o admin desmontado.
const storedOverlay = createStorageItem({
  key: ADMIN_OVERLAY_KEY,
  schema: storedAdminOverlaySchema,
  storage: getSessionStorage,
})

export function readAdminOverlay(): AdminOverlay {
  return storedOverlay.read() ?? EMPTY_ADMIN_OVERLAY
}

export function writeAdminOverlay(overlay: AdminOverlay): void {
  storedOverlay.write(overlay)
}

export function clearAdminOverlay(): void {
  storedOverlay.remove()
}
