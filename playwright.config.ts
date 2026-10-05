import { defineConfig, devices } from '@playwright/test'

// Com E2E_BASE_URL definido (smoke pós-deploy), os testes rodam contra esse
// endereço e nenhum servidor local é iniciado.
const externalBaseURL = process.env.E2E_BASE_URL
const isCI = Boolean(process.env.CI)
const localBaseURL = 'http://localhost:4173/dummy/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: externalBaseURL ?? localBaseURL,
    locale: 'pt-BR',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer:
    externalBaseURL === undefined
      ? {
          command: 'yarn build && yarn preview',
          url: localBaseURL,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        }
      : undefined,
})
