import test from 'node:test';
import assert from 'node:assert/strict';
import { createFiniteStateMachine } from '../dist/esm/index.js';

test('dispatches declared transitions and increments immutable snapshots', () => {
  const machine = createFiniteStateMachine('idle', [
    { from: 'idle', event: 'start', to: 'running' },
  ]);
  assert.equal(machine.dispatch('start'), true);
  assert.deepEqual(machine.snapshot(), { state: 'running', version: 1 });
  assert.equal(machine.dispatch('unknown'), false);
});
test('guards can refuse a transition without changing state/version', () => {
  const machine = createFiniteStateMachine('closed', [
    { from: 'closed', event: 'open', to: 'open', guard: () => false },
  ]);
  assert.equal(machine.dispatch('open'), false);
  assert.deepEqual(machine.snapshot(), { state: 'closed', version: 0 });
});
test('actions run before state commit and receive a frozen transition context', () => {
  let observed;
  const machine = createFiniteStateMachine('a', [
    {
      from: 'a',
      event: 'go',
      to: 'b',
      action(context) {
        observed = context;
      },
    },
  ]);
  machine.dispatch('go');
  assert.deepEqual(observed, { state: 'a', event: 'go', from: 'a', to: 'b' });
  assert.equal(Object.isFrozen(observed), true);
});
test('keeps state/version unchanged when guard or action throws', () => {
  const machine = createFiniteStateMachine('a', [
    {
      from: 'a',
      event: 'go',
      to: 'b',
      action() {
        throw new Error('action failed');
      },
    },
  ]);
  assert.throws(() => machine.dispatch('go'), /action failed/);
  assert.deepEqual(machine.snapshot(), { state: 'a', version: 0 });
});
test('rejects duplicate deterministic source-event pairs', () => {
  assert.throws(
    () =>
      createFiniteStateMachine('a', [
        { from: 'a', event: 'go', to: 'b' },
        { from: 'a', event: 'go', to: 'c' },
      ]),
    TypeError,
  );
});
test('rejects async guards and actions instead of treating promises as accepted transitions', () => {
  assert.throws(
    () =>
      createFiniteStateMachine('a', [{ from: 'a', event: 'go', to: 'b', guard: async () => true }]),
    TypeError,
  );
  assert.throws(
    () => createFiniteStateMachine('a', [{ from: 'a', event: 'go', to: 'b', async action() {} }]),
    TypeError,
  );
});
test('rejects reentrant dispatch and recovers after action failure', () => {
  let machine;
  machine = createFiniteStateMachine('a', [
    {
      from: 'a',
      event: 'go',
      to: 'b',
      action() {
        machine.dispatch('go');
      },
    },
  ]);
  assert.throws(() => machine.dispatch('go'), /Reentrant/);
  assert.equal(machine.snapshot().state, 'a');
  assert.equal(machine.dispatch('other'), false);
});
