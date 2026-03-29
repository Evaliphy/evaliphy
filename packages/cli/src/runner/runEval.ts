import { getRegistry, EvalTest, getHooks } from '@evaliphy/core';
import { EvaluationFixtures } from '@evaliphy/core';

export interface CLIConfig {
    timeout: number
}

function createFixtures(): EvaluationFixtures {
    return { httpClient: null }
}

async function runSingle(evalCase: EvalTest, timeout: number) {
    const start = Date.now()
    const fixtures = createFixtures()

    try {
        // run beforeEach hooks
        for (const hook of getHooks('beforeEach')) {
            await hook(fixtures)
        }

        // run the eval
        await Promise.race([
            evalCase.fn(fixtures),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Timed out after ${timeout}ms`)), timeout)
            )
        ])

        // run afterEach hooks
        for (const hook of getHooks('afterEach')) {
            await hook(fixtures)
        }

        console.log(`  ✓  ${evalCase.name} (${Date.now() - start}ms)`)
    } catch (err) {
        // still run afterEach on failure
        for (const hook of getHooks('afterEach')) {
            await Promise.resolve(hook(fixtures)).catch(() => {})
        }

        const message = err instanceof Error ? err.message : String(err)
        console.log(`  ✗  ${evalCase.name}\n     → ${message}`)
        throw err
    }
}

export async function runRegistry(config: CLIConfig): Promise<void> {
    const registry = getRegistry()

    if (registry.length === 0) {
        console.warn('\n⚠ No evals found. Did you call evaluate() in your file?\n')
        return
    }

    console.log(`\n🧪 Running ${registry.length} eval(s)...\n`)

    let failed = 0

    for (const evalCase of registry) {
        try {
            await runSingle(evalCase, config.timeout)
        } catch {
            failed++
        }
    }

    console.log(`\n${failed === 0 ? '✅ All passed' : `❌ ${failed} failed`}\n`)

    if (failed > 0) process.exit(1)
}





