export { expect } from '../packages/assertions/src/index.js';
export { defineConfig } from '../packages/core/src/config/defineConfig.js';
export { evaluate } from '../packages/core/src/evaluate.js';

// Export only necessary public types
export type { EvalInput, EvalResult, QuerySample, RagSample } from '../packages/assertions/src/engine/types.js';
export type { EvaliphyConfig } from '../packages/core/src/config/types.js';

