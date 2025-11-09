import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.next/**', 'playwright-report/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})


