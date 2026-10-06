import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

// Toda requisição dos testes passa pelo MSW; uma rota sem handler falha o teste.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Sem `globals`, a limpeza automática do Testing Library não é registrada.
afterEach(() => {
  cleanup()
  server.resetHandlers()
  server.events.removeAllListeners()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterAll(() => {
  server.close()
})

// Polyfills que o Mantine exige no jsdom, adaptados (com tipos) do guia
// oficial do Mantine 9 para Vitest.
const originalGetComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = (element: Element) =>
  originalGetComputedStyle(element)

window.HTMLElement.prototype.scrollIntoView = () => {}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    writable: true,
    value: { addEventListener: () => {}, removeEventListener: () => {} },
  })
}

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub
