type Env = {
  readonly [key: string]: unknown;
} & {
  __env_branded: never;
};

export type Injected<A> = {
  readonly get: (env: Env) => A;
};

export const evaluateInjected = <A>(injected: Injected<A>) =>
  injected.get({} as Env);

export class Context<A> implements Injected<A> {
  private key: symbol;
  constructor(readonly defaultValue: A) {
    this.key = Symbol();
  }

  get(env: Env): A {
    if (this.key in env) {
      return env[this.key as any] as any;
    } else {
      return this.defaultValue;
    }
  }

  provide(value: A) {
    return (env: Env) => ({ ...env, [this.key]: value });
  }
}

export type Get = <A>(injected: Injected<A>) => A;
export type Provide = (...providers: readonly ((env: Env) => Env)[]) => Get;

const createGet = (env: Env): Get => <A>(injected: Injected<A>) =>
  injected.get(env);
const createProvide = (env: Env): Provide => (...providers) =>
  createGet(providers.reduce((e, f) => f(e), env));

export const depend = <A>(
  f: (get: Get, provide: Provide) => A,
): Injected<A> => ({
  get: env => f(createGet(env), createProvide(env)),
});

// Example

const stateContext = new Context(100);

const printState = () =>
  depend(get => {
    const state = get(stateContext);
    console.log(state);
  });

// not injected(default)\
evaluateInjected(printState());

// inject
const runWithInject = (state: number) =>
  depend((_, provide) => {
    provide(stateContext.provide(state))(printState());
  });

evaluateInjected(runWithInject(500));
