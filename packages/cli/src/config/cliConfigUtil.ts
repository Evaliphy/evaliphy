import { CLIConfig } from '../runner/runEval.js';
import {EvaliphyError} from "@evaliphy/core";

export function parseCLI(opts: Record<string, string>): CLIConfig {
    return {
        timeout: opts.timeout ? parseInt(opts.timeout, 10) : 30000,
    }
}

export function handleFatalError(err: unknown) {
    if (err instanceof EvaliphyError) {
        console.error(`\n❌ ${err.code}\n`)
        console.error(`   ${err.message}`)
        if (err.hint) {
            console.error(`\n💡 ${err.hint}\n`)
        }
        if (process.env.DEBUG && err.stack) {
            console.error(err.stack)
        }
        return
    }

    if (err instanceof Error) {
        console.error('\n❌ Unexpected Error\n')
        console.error(`   ${err.message}`)
        if (process.env.DEBUG) {
            console.error(err.stack)
        }
        console.error('\n💡 Run with DEBUG=1 for full stack trace\n')
        return
    }

    console.error('\n❌ Unknown error\n', err)
}