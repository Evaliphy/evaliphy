import { createRequire, register } from 'node:module';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

let tsxRegistered = false;

function normalizeModule<T>(mod: unknown): T {
  const value = mod as Record<string, unknown> | undefined;
  if (value && 'default' in value) {
    return value.default as T;
  }
  return mod as T;
}

function clearRequireCache(modulePath: string) {
  try {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
  } catch {
    // Ignore if module is not in cache yet.
  }
}

function ensureTsxRegistered() {
  if (tsxRegistered) return;

  try {
    // Try Node.js 20.6.0+ register API
    // In newer tsx versions, the loader is at 'tsx' or 'tsx/esm'
    register('tsx', import.meta.url);
    tsxRegistered = true;
  } catch (error) {
    try {
      // Try CJS API if available
      require('tsx/cjs');
      tsxRegistered = true;
    } catch (innerError) {
      throw new Error(`Failed to register tsx loader. Ensure tsx is installed. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function shouldUseTsx(extension: string) {
  return extension === '.ts' || extension === '.mts' || extension === '.cts';
}

function cacheBustQuery() {
  return `update=${Date.now()}`;
}

function shouldFallbackToImport(error: unknown): boolean {
  const err = error as { code?: string; name?: string; message?: string };
  if (err?.code === 'ERR_REQUIRE_ESM') return true;
  if (err?.name !== 'SyntaxError') return false;

  const message = err?.message ?? '';
  return (
    message.includes('Cannot use import statement outside a module')
    || message.includes('Unexpected token export')
  );
}

/**
 * Runtime module loader used by config and eval imports.
 * - `.ts/.mts/.cts` use `tsx` for seamless TypeScript support.
 * - `.cjs` use `require`.
 * - `.mjs` use dynamic import.
 * - `.js` first tries `require` (for CommonJS and typeless packages), then falls back to import.
 */
export async function loadRuntimeModule<T = unknown>(filePath: string, options?: { fresh?: boolean }): Promise<T> {
  const modulePath = resolve(filePath);
  const extension = extname(modulePath).toLowerCase();
  const fresh = options?.fresh ?? false;

  if (shouldUseTsx(extension)) {
    ensureTsxRegistered();
    
    // tsx works best with dynamic import for ESM compatibility
    const fileUrl = pathToFileURL(modulePath).href;
    const importUrl = fresh ? `${fileUrl}?${cacheBustQuery()}` : fileUrl;
    const imported = await import(importUrl);
    return normalizeModule<T>(imported);
  }

  if (extension === '.cjs') {
    if (fresh) clearRequireCache(modulePath);
    return normalizeModule<T>(require(modulePath));
  }

  if (extension === '.js') {
    try {
      if (fresh) clearRequireCache(modulePath);
      return normalizeModule<T>(require(modulePath));
    } catch (error: unknown) {
      if (!shouldFallbackToImport(error)) {
        throw error;
      }
    }
  }

  const fileUrl = pathToFileURL(modulePath).href;
  const importUrl = fresh ? `${fileUrl}?${cacheBustQuery()}` : fileUrl;
  const imported = await import(importUrl);
  return normalizeModule<T>(imported);
}
