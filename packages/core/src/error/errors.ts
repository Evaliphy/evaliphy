
export enum EvaliphyErrorCode {
  // User mistakes
  MISSING_API_KEY       = 'MISSING_API_KEY',
  NO_EVALS_FOUND        = 'NO_EVALS_FOUND',
  INVALID_CONFIG        = 'INVALID_CONFIG',
  MISSING_CONFIG        = 'MISSING_CONFIG',
  INVALID_EVAL_NAME     = 'INVALID_EVAL_NAME',
  DUPLICATE_EVAL_NAME   = 'DUPLICATE_EVAL_NAME',
  FILE_NOT_FOUND        = 'FILE_NOT_FOUND',
  LLM_AUTHENTICATION_ERROR = 'LLM_AUTHENTICATION_ERROR',
  LLM_GENERIC_ERROR     = 'LLM_GENERIC_ERROR',

  // Runtime errors
  UNSUPPORTED_PROVIDER  = 'UNSUPPORTED_PROVIDER',
  EVAL_TIMEOUT          = 'EVAL_TIMEOUT',
  EVAL_FAILED           = 'EVAL_FAILED',
  HOOK_FAILED           = 'HOOK_FAILED',
  FIXTURE_INIT_FAILED   = 'FIXTURE_INIT_FAILED',

  // Internal errors
  INTERNAL_ERROR        = 'INTERNAL_ERROR',

  // Assertion errors
  ASSERTION_LLM_FAILED  = 'ASSERTION_LLM_FAILED',
  ASSERTION_FAILED      = 'ASSERTION_FAILED',
  INVALID_ASSERTION_INPUT = 'INVALID_ASSERTION_INPUT',
  PROMPT_VALIDATION_ERROR = 'PROMPT_VALIDATION_ERROR',
  PROMPT_LOAD_ERROR = 'PROMPT_LOAD_ERROR',
}

export class EvaliphyError extends Error {
  constructor(
    public readonly code: EvaliphyErrorCode,
    message: string,
    public readonly hint?: string,        
    public readonly cause?: unknown      
  ) {
    super(message)
    this.name = 'EvaliphyError'
  }
}

export class DeterministicAssertionError extends Error {
  constructor(
    public readonly result: any, // Using any to avoid circular dependency if needed, but will be DeterministicAssertionResult
    message: string
  ) {
    super(message);
    this.name = 'DeterministicAssertionError';
  }
}