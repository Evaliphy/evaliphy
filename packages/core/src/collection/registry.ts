import {Awaitable, EvalTest, EvaluationFixtures} from './types.js'
import {EvaliphyError, EvaliphyErrorCode} from "../error/errors.js";

export type HookType = 'beforeEach' | 'afterEach'

export interface Hook {
    type: HookType
    fn: (fixtures: EvaluationFixtures) => Awaitable<void>
}

const registry: EvalTest[] = []
const hooks: Hook[] = []

export function registerEval(evalCase: EvalTest) {
    
    if (!evalCase.name || evalCase.name.trim() === '') {
        throw new EvaliphyError(
            EvaliphyErrorCode.INVALID_EVAL_NAME,
            'Each evaluation should have a name.',
            "Example: evaluate(\"some name\", async () => {...})",
            "Failing because test does not have a name"
        )
    }

    registry.push(evalCase)
}

export function registerHook(type: HookType, fn: Hook['fn']) {
    hooks.push({ type, fn })
}

export function getRegistry(): EvalTest[] {
    return registry
}

export function getHooks(type: HookType): Hook['fn'][] {
    return hooks.filter(h => h.type === type).map(h => h.fn)
}