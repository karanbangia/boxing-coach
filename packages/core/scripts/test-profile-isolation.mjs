import assert from 'node:assert/strict';
import { ComboEngine, getProfile } from '../dist/index.js';

const original = getProfile('beginner');
new ComboEngine({
  difficulty: 'beginner',
  roundDuration: 120,
  restDuration: 60,
  totalRounds: 3,
  tuning: {
    intervalBase: 1234,
    movementEveryN: 2,
    defenseEveryN: 3,
  },
});
const afterTunedEngine = getProfile('beginner');

assert.equal(afterTunedEngine.interval.base, original.interval.base);
assert.equal(afterTunedEngine.actionMix.movementEveryN, original.actionMix.movementEveryN);
assert.equal(afterTunedEngine.actionMix.defenseEveryN, original.actionMix.defenseEveryN);

afterTunedEngine.comboPools.initial.reverse();
assert.deepEqual(getProfile('beginner').comboPools.initial, original.comboPools.initial);

console.log('Difficulty profiles remain isolated from workout tuning.');
