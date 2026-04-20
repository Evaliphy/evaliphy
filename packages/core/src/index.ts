// Disable AI SDK warnings
(globalThis as any).AI_SDK_LOG_WARNINGS = false;

import { ConfigLoader } from "./config/configLoader.js";
import { EvaliphyError, EvaliphyErrorCode } from "./error/errors.js";

/**
 * Internal exports for workspace packages.
 */
export { evaluate } from './evaluate.js';
export { logger } from './logger.js';

export { clearRegistry, getFileConfig, getHooks, getRegistry, registerEval } from './collection/registry.js';
export * from './collection/types.js';

export { ConfigLoader, EvaliphyError, EvaliphyErrorCode };

  export { getConfig, getResult, withConfig, withResult } from './config/context.js';
    export { mergeConfigs } from './config/mergeConfig.js';

export { defineConfig } from './config/defineConfig.js';
export { loadRuntimeModule } from './runtime/moduleLoader.js';

export * from './config/types.js';
export * from './events/emitter.js';
export * from './events/payloads.js';
export * from './events/types.js';

