import assert from 'node:assert/strict';
import { adaptNextWorkout } from '../dist/workout-adaptation.js';

const baseline = {
  difficulty: 'intermediate',
  roundDuration: 120,
  totalRounds: 4,
  restDuration: 60,
};

assert.deepEqual(
  adaptNextWorkout(baseline, 'too_easy').settings,
  { ...baseline, totalRounds: 5 },
  'too easy should change only one variable',
);
assert.deepEqual(
  adaptNextWorkout(baseline, 'just_right').settings,
  baseline,
  'just right should preserve the session',
);
assert.deepEqual(
  adaptNextWorkout(baseline, 'too_hard').settings,
  { ...baseline, totalRounds: 3 },
  'too hard should first remove one round',
);
assert.deepEqual(
  adaptNextWorkout(
    {
      difficulty: 'beginner',
      roundDuration: 120,
      totalRounds: 3,
      restDuration: 30,
    },
    'too_hard',
  ).settings,
  {
    difficulty: 'beginner',
    roundDuration: 120,
    totalRounds: 3,
    restDuration: 60,
  },
  'a minimum-length session should add recovery before changing pace',
);
assert.deepEqual(
  adaptNextWorkout(
    {
      difficulty: 'pro',
      roundDuration: 180,
      totalRounds: 12,
      restDuration: 15,
    },
    'too_easy',
  ).settings,
  {
    difficulty: 'pro',
    roundDuration: 180,
    totalRounds: 12,
    restDuration: 15,
  },
  'the top boundary should remain valid',
);

console.log('Passed adaptive next-workout recommendation cases.');
