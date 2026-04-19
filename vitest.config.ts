import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'node_modules/**',
      ],
    },
  },
})
