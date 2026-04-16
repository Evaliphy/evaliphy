import { EvaliphyError, EvaliphyErrorCode, logger } from '@evaliphy/core';
import { Middleware, MiddlewareFn, RetryConfig } from './types.js';

export function composeMiddleware(
  middlewares: Middleware[],
  baseFetch: (req: Request) => Promise<Response>
): MiddlewareFn {
  return (req: Request) => {
    let index = -1;

    const dispatch = async (i: number): Promise<Response> => {
      // For retries to work, we allow calling the same index again
      // but we still want to prevent multiple calls to next() within the same middleware execution
      // if they are not intended. However, the current implementation of retryMiddleware
      // intentionally calls next() multiple times.

      index = i;

      if (i === middlewares.length) {
        return baseFetch(req);
      }

      const middleware = middlewares[i];
      return middleware.handle(req, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}

function summarizeError(err: unknown): { type: string; message: string; causeCode?: string } {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    const causeCode =
      typeof cause === "object" &&
      cause !== null &&
      "code" in cause &&
      typeof (cause as { code?: unknown }).code === "string"
        ? (cause as { code: string }).code
        : undefined;

    return {
      type: err.name,
      message: err.message,
      ...(causeCode ? { causeCode } : {}),
    };
  }

  return {
    type: typeof err,
    message: String(err),
  };
}

export const loggingMiddleware: Middleware = {
  name: 'logging',
  async handle(req, next) {
    const start = Date.now();
    try {
      const res = await next(req);
      const duration = Date.now() - start;
      logger.debug({
        method: req.method,
        url: req.url,
        status: res.status,
        duration
      }, `[HttpClient] ${req.method} ${req.url} - ${res.status} (${duration}ms)`);
      return res;
    } catch (err) {
      const duration = Date.now() - start;
      logger.error({
        method: req.method,
        url: req.url,
        duration,
        error: summarizeError(err)
      }, `[HttpClient] ${req.method} ${req.url} - FAILED (${duration}ms)`);
      throw err;
    }
  },
};

export function createTimeoutMiddleware(timeoutMs: number): Middleware {
  return {
    name: 'timeout',
    async handle(req, next) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await Promise.race([
          next(req),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new EvaliphyError(
              EvaliphyErrorCode.EVAL_TIMEOUT,
              `HTTP request timeout after ${timeoutMs}ms`,
              `Increase timeout in config if the endpoint is slow`
            )), timeoutMs)
          ),
        ]);
        return response;
      } finally {
        clearTimeout(id);
      }
    },
  };
}

export function createRetryMiddleware(config: RetryConfig): Middleware {
  return {
    name: 'retry',
    async handle(req, next) {
      let lastError: any;
      for (let attempt = 0; attempt <= config.attempts; attempt++) {
        try {
          const res = await next(req);
          if (res.status >= 500 && attempt < config.attempts) {
            logger.warn({
              attempt,
              status: res.status,
              url: req.url
            }, `Retrying request to ${req.url} due to server error ${res.status}`);
            await new Promise((resolve) => setTimeout(resolve, config.delay));
            continue;
          }
          return res;
        } catch (err) {
          lastError = err;
          if (attempt < config.attempts) {
            logger.warn({
              attempt,
              error: summarizeError(err),
              url: req.url
            }, `Retrying request to ${req.url} due to error`);
            await new Promise((resolve) => setTimeout(resolve, config.delay));
            continue;
          }
        }
      }

      if (lastError instanceof EvaliphyError) {
        throw lastError;
      }

      throw new EvaliphyError(
        EvaliphyErrorCode.EVAL_FAILED,
        `Request failed after ${config.attempts} retries`,
        undefined,
        lastError
      );
    },
  };
}
