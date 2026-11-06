export interface TransitionContext {
  state: string;
  event: string;
  from: string;
  to: string;
}
export interface TransitionDefinition {
  from: string;
  event: string;
  to: string;
  guard?: (context: TransitionContext) => boolean;
  action?: (context: TransitionContext) => void;
}
export interface MachineSnapshot {
  readonly state: string;
  readonly version: number;
}
export interface FiniteStateMachine {
  snapshot(): MachineSnapshot;
  dispatch(event: string): boolean;
}
function label(value: string, name: string): void {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128)
    throw new TypeError(`${name} must be a nonempty string up to 128 characters.`);
}
function isAsyncFunction(value: Function): boolean {
  return value.constructor.name === 'AsyncFunction';
}
export function createFiniteStateMachine(
  initial: string,
  definitions: readonly TransitionDefinition[],
): FiniteStateMachine {
  label(initial, 'Initial state');
  if (!Array.isArray(definitions) || definitions.length > 10_000)
    throw new RangeError('Transitions must be an array of at most 10000 entries.');
  const transitions = new Map<string, TransitionDefinition>();
  for (const definition of definitions) {
    if (!definition || typeof definition !== 'object')
      throw new TypeError('Transition must be an object.');
    label(definition.from, 'Source state');
    label(definition.event, 'Event');
    label(definition.to, 'Target state');
    if (definition.guard !== undefined && typeof definition.guard !== 'function')
      throw new TypeError('Guard must be a function.');
    if (definition.action !== undefined && typeof definition.action !== 'function')
      throw new TypeError('Action must be a function.');
    if (
      (definition.guard && isAsyncFunction(definition.guard)) ||
      (definition.action && isAsyncFunction(definition.action))
    )
      throw new TypeError('Guards and actions must be synchronous.');
    const key = `${definition.from}\u0000${definition.event}`;
    if (transitions.has(key))
      throw new TypeError(`Duplicate transition from ${definition.from} on ${definition.event}.`);
    transitions.set(key, { ...definition });
  }
  let state = initial;
  let version = 0;
  let transitioning = false;
  return {
    snapshot() {
      return Object.freeze({ state, version });
    },
    dispatch(event) {
      label(event, 'Event');
      if (transitioning) throw new TypeError('Reentrant dispatch is not supported.');
      const transition = transitions.get(`${state}\u0000${event}`);
      if (!transition) return false;
      const context = Object.freeze({ state, event, from: state, to: transition.to });
      transitioning = true;
      try {
        if (transition.guard && !transition.guard(context)) return false;
        transition.action?.(context);
        state = transition.to;
        version += 1;
        return true;
      } finally {
        transitioning = false;
      }
    },
  };
}
