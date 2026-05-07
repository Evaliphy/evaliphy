import { EvaliphyConfig } from '../config/types.js';

export interface RunStartPayload {
  runId: string;
  totalTests: number;
  resolvedConfig: EvaliphyConfig;
}

export interface RunEndPayload {
  runId: string;
  passed: number;
  failed: number;
  duration: number;
}

export interface TestStartPayload {
  runId: string;
  testName: string;
  config: EvaliphyConfig;
}

export interface TestPassPayload {
  runId: string;
  testName: string;
  duration: number;
  result?: any;
}

export interface TestFailPayload {
  runId: string;
  testName: string;
  duration: number;
  error: Error;
  result?: any;
}

export interface TestRetryPayload {
  runId: string;
  testName: string;
  attempt: number;
  maxRetries: number;
}

export type HookType = 'beforeEach' | 'afterEach';

export interface HookStartPayload {
  runId: string;
  testName: string;
  hook: HookType;
}

export interface HookEndPayload {
  runId: string;
  testName: string;
  hook: HookType;
  duration: number;
}

export interface HookFailPayload {
  runId: string;
  testName: string;
  hook: HookType;
  error: Error;
}

export interface ConfigResolvedPayload {
  runId: string;
  source: 'file' | 'test' | 'cli';
  config: EvaliphyConfig;
}

export interface DiscoveryStartPayload {
  runId: string;
  dir: string;
}

export interface DiscoveryFilePayload {
  runId: string;
  file: string;
  testCount: number;
}

export interface DiscoveryEndPayload {
  runId: string;
  fileCount: number;
  totalTests: number;
}
