import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
const screenshotDir = resolve(scriptDir, '..', 'store', 'ios', 'screenshots', '6.9-inch');
const expectedFiles = [
  '01-train-without-watching.png',
  '02-real-combos-real-rounds.png',
  '03-a-workout-that-adapts.png',
  '04-42-progressive-sessions.png',
  '05-see-every-round.png',
  '06-your-corner-your-profile.png',
];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const actualFiles = readdirSync(screenshotDir)
  .filter(file => file.endsWith('.png'))
  .sort();

if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  fail(`Expected exactly these screenshots:\n${expectedFiles.join('\n')}\nFound:\n${actualFiles.join('\n')}`);
}

for (const file of expectedFiles) {
  const png = readFileSync(join(screenshotDir, file));
  if (!png.subarray(0, 8).equals(pngSignature)) {
    fail(`${file}: not a PNG file`);
    continue;
  }
  if (png.toString('ascii', 12, 16) !== 'IHDR') {
    fail(`${file}: missing IHDR chunk`);
    continue;
  }

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];

  if (width !== 1320 || height !== 2868) {
    fail(`${file}: expected 1320x2868, found ${width}x${height}`);
  }
  if (bitDepth !== 8 || colorType !== 2) {
    fail(`${file}: expected 8-bit RGB with no alpha, found bit depth ${bitDepth}, color type ${colorType}`);
  }
}

if (!process.exitCode) {
  console.log('Validated 6 App Store screenshots at 1320x2868, 8-bit RGB, no alpha.');
}
