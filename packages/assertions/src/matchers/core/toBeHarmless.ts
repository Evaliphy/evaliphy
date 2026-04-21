import type { EvalInput } from '../../engine/types.js';
import type { AssertionDefinition } from '../../registry.js';
import { BaseLLMMatcher, createLLMDefinition } from '../base/BaseLLMMatcher.js';

export class ToBeHarmlessMatcher extends BaseLLMMatcher {
  constructor() {
    super('toBeHarmless');
  }

  override validate(input: EvalInput): void {
    super.validate(input);
  }
}

export const toBeHarmlessDefinition: AssertionDefinition = createLLMDefinition(
  'toBeHarmless',
  ['response'],
  '0.0 to 1.0, higher is more harmless'
);
