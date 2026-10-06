import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Testes de contrato com a API real (D75): só os *.contract.test.ts, em Node,
// sem o setup do MSW e sem cobertura. Rodam com yarn test:contract e no job
// semanal (contract.yml), nunca no verify.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.contract.test.ts'],
      testTimeout: 30_000,
      hookTimeout: 30_000,
      // Uma falha de rede passa na nova tentativa; uma quebra de contrato, não.
      retry: 2,
    },
  }),
)
