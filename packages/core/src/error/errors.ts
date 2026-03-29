
export enum EvaliphyErrorCode {
  // User mistakes
  NO_EVALS_FOUND        = 'NO_EVALS_FOUND',
  INVALID_CONFIG        = 'INVALID_CONFIG',
  MISSING_CONFIG        = 'MISSING_CONFIG',
  INVALID_EVAL_NAME     = 'INVALID_EVAL_NAME',
  DUPLICATE_EVAL_NAME   = 'DUPLICATE_EVAL_NAME',
  FILE_NOT_FOUND        = 'FILE_NOT_FOUND',

  // Runtime errors
  EVAL_TIMEOUT          = 'EVAL_TIMEOUT',
  EVAL_FAILED           = 'EVAL_FAILED',
  HOOK_FAILED           = 'HOOK_FAILED',
  FIXTURE_INIT_FAILED   = 'FIXTURE_INIT_FAILED',

  // Internal errors
  INTERNAL_ERROR        = 'INTERNAL_ERROR',
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