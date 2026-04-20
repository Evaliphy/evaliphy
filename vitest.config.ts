import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@evaliphy/core': resolve('./packages/core/src/index.ts'),
      '@evaliphy/ai': resolve('./packages/ai/src/index.ts'),
      '@evaliphy/assertions': resolve('./packages/assertions/src/index.ts'),
      '@evaliphy/reporters': resolve('./packages/reporters/src/index.ts'),
      '@evaliphy/client': resolve('./packages/client/src/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['packages/**/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['packages/**/src/**/*.ts'],
      exclude: [
        'packages/**/src/**/*.d.ts',
        'packages/**/src/index.ts',
        '**/node_modules/**',
      ],
      // Thresholds reflect the current baseline coverage measured 2026-04-19.
      // These act as a regression floor — raise them as coverage improves.
      thresholds: {
        lines: 54,
        functions: 60,
        branches: 44,
        statements: 53,
      },
      reportsDirectory: './coverage',
    },
  },
});
