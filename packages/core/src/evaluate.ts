import { Awaitable, EvalTest, EvaluationFixtures } from './collection/types.js'
import { registerEval, registerHook } from './collection/registry.js'

export function createEvaluate() {

    const evaluate = function (
        name: string,
        fn: (fixtures: EvaluationFixtures) => Awaitable<void>
    ) {
        const testNode: EvalTest = { kind: 'test', name, fn }
        registerEval(testNode)
    }

    evaluate.useConfig = function () {
        // TODO
    }

    evaluate.beforeEach = function (fn: (fixtures: EvaluationFixtures) => Awaitable<void>) {
        registerHook('beforeEach', fn)
    }

    evaluate.afterEach = function (fn: (fixtures: EvaluationFixtures) => Awaitable<void>) {
        registerHook('afterEach', fn)
    }

    return evaluate
}

export const evaluate = createEvaluate()