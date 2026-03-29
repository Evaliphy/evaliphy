
export type Awaitable<T> = Promise<T> | T

export interface EvaluationFixtures {
    httpClient: any
}

export interface EvalTest {
    kind: 'test';
    name: string;
    fn: (fixtures: EvaluationFixtures) => Awaitable<void>;
}
