import { expect, test as base } from '@playwright/test'
import { installMockApi } from './mock-api.ts'

// Com E2E_BASE_URL (smoke pós-deploy), os testes rodam contra o site publicado
// e a API real; sem ele, contra o preview local com a API mockada (D42).
export const isDeployed = process.env.E2E_BASE_URL !== undefined

// Todo spec importa test e expect daqui: a fixture automática instala a API
// mockada em cada página antes do teste. O parâmetro não se chama "use" para
// não ser confundido com o hook use do React pelo lint.
export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, provide) => {
      if (isDeployed) {
        await provide()
        return
      }

      const unhandled = await installMockApi(page)
      await provide()

      // Como o onUnhandledRequest: 'error' do MSW nos testes unitários: uma
      // requisição externa sem mock falha o teste.
      expect(unhandled, 'requisições externas sem mock').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
