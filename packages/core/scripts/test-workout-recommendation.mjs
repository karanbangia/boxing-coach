import assert from 'node:assert/strict';
import { recommendFirstWorkout } from '../dist/workout-recommendation.js';

const cases = [
  {
    name: 'beginner starts with a short fundamentals session',
    profile: {
      experience: 'beginner',
      goal: 'fundamentals',
      preferredSessionMinutes: 20,
    },
    expected: {
      difficulty: 'beginner',
      roundDuration: 120,
      totalRounds: 3,
      restDuration: 60,
    },
  },
  {
    name: 'intermediate fitness uses shorter rests without a long first session',
    profile: {
      experience: 'intermediate',
      goal: 'fitness',
      preferredSessionMinutes: 30,
    },
    expected: {
      difficulty: 'intermediate',
      roundDuration: 120,
      totalRounds: 4,
      restDuration: 30,
    },
  },
  {
    name: 'advanced competition uses regulation rounds at the selected level',
    profile: {
      experience: 'advanced',
      goal: 'competition',
      preferredSessionMinutes: 20,
    },
    expected: {
      difficulty: 'advanced',
      roundDuration: 180,
      totalRounds: 5,
      restDuration: 60,
    },
  },
  {
    name: 'a ten-minute professional session stays inside an approachable format',
    profile: {
      experience: 'professional',
      goal: 'heavy_bag',
      preferredSessionMinutes: 10,
    },
    expected: {
      difficulty: 'pro',
      roundDuration: 120,
      totalRounds: 3,
      restDuration: 60,
    },
  },
];

for (const testCase of cases) {
  assert.deepEqual(
    recommendFirstWorkout(testCase.profile),
    testCase.expected,
    testCase.name,
  );
}

console.log(`Passed ${cases.length} first-workout recommendation cases.`);
