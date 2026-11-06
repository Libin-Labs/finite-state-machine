# @lp-labs/finite-state-machine

Deterministic synchronous finite-state machine. A small deterministic synchronous finite state machine with guards, transactional state commits, and reentrancy rejection.

## Install

```sh
npm install @lp-labs/finite-state-machine
```

## Quick start

```js
import { createFiniteStateMachine } from '@lp-labs/finite-state-machine';
const machine = createFiniteStateMachine('idle', [{ from: 'idle', event: 'start', to: 'running' }]);
console.log(machine.dispatch('start'), machine.snapshot());
```

## Runtime exports

- `createFiniteStateMachine`

The package supplies independent ESM and CommonJS builds, bundled declarations, and no runtime or peer dependencies.

## Complete public TypeScript declarations

```ts
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
export declare function createFiniteStateMachine(
  initial: string,
  definitions: readonly TransitionDefinition[],
): FiniteStateMachine;
```

## Scope and limits

Maps a unique (state,event) pair to one target with an optional synchronous guard and action. Unknown events and guard refusals return false; successful transitions increment a versioned immutable snapshot.

## Errors and bounds

Malformed transitions/labels and duplicate keys raise TypeError; excessive transition arrays raise RangeError. Action and guard exceptions propagate without changing machine state.

## Customization

Declare all legal transitions up front. Each source-state/event pair must be unique; use guards for conditional acceptance and keep actions synchronous.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
