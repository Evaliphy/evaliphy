import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadRuntimeModule } from '../../src/runtime/moduleLoader.js';

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'evaliphy-module-loader-'));
  tempDirs.push(dir);
  return dir;
}

async function writeModule(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('loadRuntimeModule', () => {
  it('loads TypeScript modules via tsx', async () => {
    const dir = await createTempDir();
    const filePath = join(dir, 'config.ts');

    await writeModule(filePath, `export default { model: 'gpt-4o-mini', timeout: 1200 };`);

    const mod = await loadRuntimeModule<{ model: string; timeout: number }>(filePath);

    expect(mod.model).toBe('gpt-4o-mini');
    expect(mod.timeout).toBe(1200);
  });

  it('loads CommonJS .js modules with require', async () => {
    const dir = await createTempDir();
    const filePath = join(dir, 'config.js');

    await writeModule(filePath, `module.exports = { retries: 2, provider: 'openai' };`);

    const mod = await loadRuntimeModule<{ retries: number; provider: string }>(filePath);

    expect(mod.retries).toBe(2);
    expect(mod.provider).toBe('openai');
  });

  it('falls back to import for ESM syntax in .js files', async () => {
    const dir = await createTempDir();
    const filePath = join(dir, 'esm-config.js');

    await writeModule(filePath, `export default { evalDir: './evals', testMatch: '*.eval.ts' };`);

    const mod = await loadRuntimeModule<{ evalDir: string; testMatch: string }>(filePath);

    expect(mod.evalDir).toBe('./evals');
    expect(mod.testMatch).toBe('*.eval.ts');
  });

  it('respects fresh reload for require-backed modules', async () => {
    const dir = await createTempDir();
    const filePath = join(dir, 'reload.cjs');

    await writeModule(filePath, `module.exports = { value: 1 };`);

    const first = await loadRuntimeModule<{ value: number }>(filePath);
    await writeModule(filePath, `module.exports = { value: 2 };`);
    const secondWithoutFresh = await loadRuntimeModule<{ value: number }>(filePath);
    const thirdWithFresh = await loadRuntimeModule<{ value: number }>(filePath, { fresh: true });

    expect(first.value).toBe(1);
    expect(secondWithoutFresh.value).toBe(1);
    expect(thirdWithFresh.value).toBe(2);
  });

  it('respects fresh reload for import-backed modules', async () => {
    const dir = await createTempDir();
    const filePath = join(dir, 'reload.mjs');

    await writeModule(filePath, `export default { value: 1 };`);

    const first = await loadRuntimeModule<{ value: number }>(filePath);
    await writeModule(filePath, `export default { value: 2 };`);
    const secondWithoutFresh = await loadRuntimeModule<{ value: number }>(filePath);
    const thirdWithFresh = await loadRuntimeModule<{ value: number }>(filePath, { fresh: true });

    expect(first.value).toBe(1);
    expect(secondWithoutFresh.value).toBe(1);
    expect(thirdWithFresh.value).toBe(2);
  });
});
