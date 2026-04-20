import { defineConfig } from 'tsdown';

export default defineConfig([
  // Entry 1 — SDK bundle (what consumers import)
  {
    entry: {
      index: 'src/index.ts',
    },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    publicDir: 'packages/assertions/prompts',
    // Inline these — they get bundled INTO dist/index.js
    noExternal: [
      /^evaliphy-/,           // all workspace packages
      /^@evaliphy\//,         // all scoped workspace packages
    ],
    // These stay as runtime dependencies — NOT bundled
    external: [
        'pino-pretty',
      'openai',
      'commander',
      'ts-node',
      'tsx',
      'fast-glob',
      'pino',
      'node:*',               // all Node built-ins
    ],
  },

  // Entry 2 — CLI binary
  {
    entry: {
      bin: 'packages/cli/src/bin.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    dts: false,
    noExternal: [
      /^evaliphy-/,
      /^@evaliphy\//,
      /^\./,                  // Inline relative imports
      /^[a-zA-Z]/,            // Try to inline everything else that isn't explicitly external
    ],
    external: [
      'commander',
      'fast-glob',
      'ts-node',
      'tsx',
      'pino',
      'node:*',
    ],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
