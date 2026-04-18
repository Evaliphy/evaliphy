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
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      reportsDirectory: './coverage',
    },
  },
});
