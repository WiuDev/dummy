import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const coreThresholds = {
  lines: 90,
  statements: 90,
  functions: 90,
  branches: 85,
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // Só os testes de src/: os specs do Playwright (e2e/) rodam com o Playwright.
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src'],
        exclude: [
          'src/main.tsx',
          'src/test/**',
          '**/*.test.{ts,tsx}',
          '**/*.d.ts',
          // CSS Modules e os index.ts das features (só reexportam) não têm
          // código a cobrir; sem isto, aparecem zerados.
          '**/*.css',
          'src/features/*/index.ts',
        ],
        reporter: [['text', { skipFull: false }], 'html', 'json-summary'],
        thresholds: {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
          'src/lib/**': coreThresholds,
          'src/services/**': coreThresholds,
          'src/hooks/**': coreThresholds,
          'src/schemas/**': coreThresholds,
        },
      },
    },
  }),
)
