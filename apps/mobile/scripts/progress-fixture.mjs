#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const action = process.argv[2] ?? 'seed';
const urls = {
  seed: 'boxingcoach://dev/seed-progress',
  clear: 'boxingcoach://dev/clear-progress',
};

if (!(action in urls)) {
  console.error('Usage: node scripts/progress-fixture.mjs <seed|clear>');
  process.exit(1);
}

const result = spawnSync(
  'xcrun',
  ['simctl', 'openurl', 'booted', urls[action]],
  { encoding: 'utf8', stdio: 'pipe' },
);

if (result.status !== 0) {
  console.error(result.stderr.trim() || 'Could not open the Boxing Coach simulator app.');
  process.exit(result.status ?? 1);
}

console.log(
  action === 'seed'
    ? 'Sent 30 progress fixtures to the booted iOS Simulator.'
    : 'Requested progress-fixture removal from the booted iOS Simulator.',
);
