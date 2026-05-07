/**
 * Configuration for the build-in HTTP client.
 * These settings will apply to the `httpClient` fixture in all evaluations.
 */
export interface HttpConfig {
  /** The base URL to prepend to all request paths. */
  baseUrl: string
  /** Global request timeout in milliseconds. */
  timeout?: number
  /**
   * Global retry configuration for failed requests (5xx or network errors).
   */
  retry?: {
    /** Number of retry attempts before giving up. */
    attempts: number
    /** Delay between retry attempts in milliseconds. */
    delay: number
  }
  /** Common HTTP headers to send with every request. */
  headers?: Record<string, string>
}

export interface DeterministicConfig {
  /**
   * If true, the first failed deterministic assertion will throw and stop the test.
   * If false (default), failures are recorded but execution continues (soft assertions).
   */
  failFast?: boolean
}

export interface LLMJudgeConfig {
  // the model string — provider-prefixed like "openai/gpt-4o-mini"
  // or just "gpt-4o-mini" when provider is explicit
  model: string

  // where the request goes
  provider: LLMProvider

  // generation settings
  temperature?: number        // default: 0 — judges should be deterministic
  maxTokens?: number        // default: 1000
  timeout?: number        // overrides global timeout for promptManager calls
  promptsDir?: string       // directory where custom prompts are stored
  /**
   * Whether to continue test execution even if an assertion fails.
   * @default true
   */
  continueOnFailure?: boolean
}

export type LLMProvider =
  | DirectProvider            // talk directly to OpenAI, Anthropic etc
  | GatewayProvider           // talk via OpenRouter, LiteLLM, Vercel etc

export interface DirectProvider {
  type: 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq' | 'cohere'
  apiKey?: string             // falls back to env var if not set
}

export interface GatewayProvider {
  type: 'gateway'
  url: string                 // base URL of the gateway
  apiKey?: string             // falls back to env var
  name?: string               // optional — used in logs and reports
}

/**
 * Main Evaliphy configuration object.
 * Define this in `evaliphy.config.ts`.
 */
export interface EvaliphyConfig {
  /** General settings for the HTTP client fixture. */
  http?: HttpConfig

  /**
   * LLM as Judge Config
   */
  llmAsJudgeConfig?: LLMJudgeConfig
  /**
   * Deterministic Assertions Config
   */
  deterministicConfig?: DeterministicConfig
  /**
   * Config file to use
   */
  configFile?: string
  /** Global timeout for individual test functions (ms). */
  timeout?: number

  /**
   * List of reporters to use for evaluation results.
   * Can be a string name of a built-in reporter or a custom reporter instance.
   */
  reporters?: (string | any)[] | string

  /** The root directory to search for evaluation files (default: './evals'). */
  evalDir?: string
  /**
   * Glob patterns to match evaluation files.
   * (default: ['**\/*.eval.ts', '**\/*.eval.js'])
   */
  testMatch?: string[]
  /** Glob patterns to exclude when scanning for tests. */
  testIgnore?: string[]
}
