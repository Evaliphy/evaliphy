import type { EvalInput } from '../../engine/types.js';
import type { AssertionDefinition } from '../../registry.js';
import { BaseLLMMatcher, createLLMDefinition } from '../base/BaseLLMMatcher.js';

export class ToBeCoherentMatcher extends BaseLLMMatcher {
  constructor() {
    super('toBeCoherent');
  }

  override validate(input: EvalInput): void {
    super.validate(input);
  }
}

export const toBeCoherentDefinition: AssertionDefinition = createLLMDefinition(
  'toBeCoherent',
  ['response'],
  '0.0 to 1.0, higher is more coherent'
);
