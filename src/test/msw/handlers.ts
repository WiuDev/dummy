import type { RequestHandler } from 'msw'

// Handlers padrão (caminho feliz) dos endpoints da DummyJSON. Cada teste pode
// sobrescrevê-los com server.use(...).
export const handlers: RequestHandler[] = []
