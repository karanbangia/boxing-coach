import assert from 'node:assert/strict';
import { PUNCH_NUMBER_GUIDE } from '../dist/index.js';

assert.deepEqual(
  PUNCH_NUMBER_GUIDE.map(({ number, name, side }) => ({ number, name, side })),
  [
    { number: 1, name: 'Jab', side: 'lead' },
    { number: 2, name: 'Cross', side: 'rear' },
    { number: 3, name: 'Lead Hook', side: 'lead' },
    { number: 4, name: 'Rear Hook', side: 'rear' },
    { number: 5, name: 'Lead Uppercut', side: 'lead' },
    { number: 6, name: 'Rear Uppercut', side: 'rear' },
  ],
);

assert.equal(new Set(PUNCH_NUMBER_GUIDE.map(punch => punch.number)).size, 6);
assert.ok(PUNCH_NUMBER_GUIDE.every(punch => punch.cue.toLowerCase().includes(punch.side)));

console.log('Punch-number guide matches the canonical stance-safe 1–6 mapping.');
