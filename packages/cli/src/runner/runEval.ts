import {
    clearRegistry,
    ConfigLoader,
    emitter,
    EvaliphyConfig,
    EvaliphyError,
    EvaliphyErrorCode,
    EvalTest,
    getFileConfig,
    getHooks,
    getRegistry,
    loadRuntimeModule,
    logger,
    withConfig,
    withResult
} from '@evaliphy/core';
import path from 'path';
import { discoverFiles } from '../discovery/discoverFiles.js';
import { createFixtures, registerReporters, resolveReporters } from './runnerUtil.js';

/**
 * Runs a single evaluation test case.
 */
async function runSingle(evalCase: EvalTest, config: EvaliphyConfig, runId: string, file: string) {
    const start = Date.now();
    const fixtures = createFixtures(config);
    const testLog = logger.child({ testName: evalCase.name });

    testLog.debug({ config }, 'Test started');

    await emitter.emit('test:start', { runId, testName: evalCase.name, config });

    const result: any = {
        sampleId: evalCase.name,
        evalFile: path.relative(process.cwd(), file),
        status: 'passed',
        inputs: { query: '', context: '', response: '' },
        assertions: {},
        http: { status: 0, url: '', method: 'POST' },
        timings: { ttfb: 0, total: 0 }
    };

    try {
        await withResult(result, async () => {
            await executeHooks('beforeEach', evalCase, fixtures, runId, testLog, true);

            testLog.debug('Started running eval test');

            await withConfig(config, () => Promise.race([
                evalCase.fn(fixtures),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Timed out after ${config.timeout}ms`)), config.timeout),
                )
            ]));
        });

        const duration = Date.now() - start;
        result.timings.total = duration;
        await emitter.emit('test:pass', { runId, testName: evalCase.name, duration, result } as any);
    } catch (err) {
        const duration = Date.now() - start;
        const error = err instanceof Error ? err : new Error(String(err));
        
        result.status = 'failed';
        result.timings.total = duration;
        if (!error.message.includes('failed:')) {
            result.error = {
                message: error.message,
                type: error.name,
                stack: error.stack
            };
        }

        await emitter.emit('test:fail', { runId, testName: evalCase.name, duration, error, result } as any);

        testLog.debug(error.message);
        throw err;
    } finally {
        await executeHooks('afterEach', evalCase, fixtures, runId, testLog, false);
    }
}

/**
 * Helper to execute hooks (beforeEach/afterEach) and emit events.
 */
async function executeHooks(
    type: 'beforeEach' | 'afterEach',
    evalCase: EvalTest,
    fixtures: any,
    runId: string,
    testLog: any,
    rethrow: boolean
) {
    for (const hook of getHooks(type)) {
        testLog.debug(`Started running ${type} hook`);
        const hookStart = Date.now();
        await emitter.emit('hook:start', { runId, testName: evalCase.name, hook: type });
        try {
            await Promise.resolve(hook(fixtures));
            await emitter.emit('hook:end', { runId, testName: evalCase.name, hook: type, duration: Date.now() - hookStart });
        } catch (hookErr) {
            const error = hookErr as Error;
            await emitter.emit('hook:fail', { runId, testName: evalCase.name, hook: type, error });
            testLog.error({ err: error, hook: type }, 'Hook failed');
            if (rethrow) {
                throw new EvaliphyError(
                    EvaliphyErrorCode.HOOK_FAILED,
                    `Hook '${type}' failed for test '${evalCase.name}': ${error.message}`,
                    'Check your hook implementation for errors.',
                    error
                );
            }
        }
    }
}

/**
 * Resolves the list of files to run based on explicit input or discovery.
 */
async function getFilesToRun(explicitFile: string | undefined, config: EvaliphyConfig): Promise<string[]> {
    if (explicitFile) {
        const fullPath = path.resolve(process.cwd(), explicitFile);
        return [fullPath];
    }

    // Find baseDir when configPath is given otherwise fallback to root directory
    const baseDir = config.configFile ? path.dirname(config.configFile) : process.cwd();

    return discoverFiles({
        testDir: path.resolve(baseDir, config.evalDir!),
        testMatch: config.testMatch!,
        testIgnore: config.testIgnore!,
    });
}

/**
 * Dynamically imports an evaluation file and ensures the registry is cleared before if needed.
 */
async function importEvalFile(file: string) {
    try {
        await loadRuntimeModule(file, { fresh: true });
    } catch (err: any) {
        throw new EvaliphyError(
            EvaliphyErrorCode.INTERNAL_ERROR,
            `Failed to import evaluation file: ${file}`,
            'Ensure the file path is correct and the file has valid runtime syntax.',
            err
        );
    }
}

/**
 * First pass: discover total tests to run (used for reporting total counts).
 */
async function discoverTotalTests(files: string[], config: EvaliphyConfig, runId: string): Promise<number> {
    let total = 0;

    await emitter.emit('discovery:start', { runId, dir: config.evalDir! });

    for (const file of files) {
        clearRegistry();
        try {
            await importEvalFile(file);
            const count = getRegistry().length;
            total += count;
            await emitter.emit('discovery:file', { runId, file, testCount: count });
        } catch (err) {
            logger.error({ err, file }, 'Failed to import file during discovery');
            // We continue discovery even if one file fails
        }
    }

    await emitter.emit('discovery:end', { runId, fileCount: files.length, totalTests: total });
    return total;
}

/**
 * Runs all evaluations defined in a single file.
 */
async function runTestsInFile(file: string, baseConfig: EvaliphyConfig, runId: string): Promise<{ passed: number, failed: number }> {
    clearRegistry();

    try {
        await importEvalFile(file);
    } catch (err) {
        logger.error({ err, file }, 'Failed to import file for execution');
        return { passed: 0, failed: 0 };
    }

    // After import, evaluate.use() have been called, important for config.
    const fileConfig = getFileConfig();
    const configLoader = ConfigLoader.getInstance();
    const config = await configLoader.load(process.cwd(), fileConfig);

    const registry = getRegistry();
    if (registry.length === 0) {
        logger.warn({ file }, 'No evals found in file');
        return { passed: 0, failed: 0 };
    }

    let passed = 0;
    let failed = 0;

    for (const evalCase of registry) {
        try {
            await runSingle(evalCase, config, runId, file);
            passed++;
        } catch {
            failed++;
        }
    }
    return { passed, failed };
}

/**
 * Main entry point for running the test registry.
 */
export async function runRegistry(explicitFile?: string): Promise<void> {

    // Initial load to get base config (CLI overrides + global config)
    const configLoader = ConfigLoader.getInstance();
    let config = await configLoader.load();

    const runId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    registerReporters(resolveReporters(config));

    const filesToRun = await getFilesToRun(explicitFile, config);
    if (filesToRun.length === 0) {
        throw new EvaliphyError(
            EvaliphyErrorCode.NO_EVALS_FOUND,
            `No evaluation files found matching the criteria.`,
            explicitFile ? `Check if the file '${explicitFile}' exists.` : `Check your config (evalDir: ${config.evalDir}, match: ${config.testMatch})`
        );
    }

    // Discover tests across all selected files for reporting
    let totalTests = 0;
    if (explicitFile) {
        const evalDir = path.dirname(path.resolve(process.cwd(), explicitFile));
        await emitter.emit('discovery:start', { runId, dir: evalDir });

        clearRegistry();
        await importEvalFile(filesToRun[0]);
        totalTests = getRegistry().length;

        await emitter.emit('discovery:file', { runId, file: filesToRun[0], testCount: totalTests });
        await emitter.emit('discovery:end', { runId, fileCount: 1, totalTests });

        if (totalTests === 0) {
            throw new EvaliphyError(
                EvaliphyErrorCode.NO_EVALS_FOUND,
                `The file '${explicitFile}' contains no evaluation tests.`,
                'Ensure you are using the evaluate() function to define your tests.'
            );
        }
    } else {
        totalTests = await discoverTotalTests(filesToRun, config, runId);
        if (totalTests === 0) {
            throw new EvaliphyError(
                EvaliphyErrorCode.NO_EVALS_FOUND,
                'No evaluation tests discovered in the specified directory.',
                'Ensure your test files have the .eval.ts or .eval.js extension and use the evaluate() function.'
            );
        }
    }

    await emitter.emit('run:start', {
        runId,
        totalTests,
        resolvedConfig: config
    });

    let totalPassed = 0;
    let totalFailed = 0;

    for (const file of filesToRun) {
        const { passed, failed } = await runTestsInFile(file, config, runId);
        totalPassed += passed;
        totalFailed += failed;
    }

    await emitter.emit('run:end', {
        runId,
        passed: totalPassed,
        failed: totalFailed,
        duration: Date.now() - startTime
    });

    if (totalFailed > 0) process.exit(1);
}
