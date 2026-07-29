import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mobileRoot = resolve(scriptDir, '..');
const sourceDir = join(mobileRoot, 'store', 'ios', 'screenshots', 'source');
const outputDir = join(mobileRoot, 'store', 'ios', 'screenshots', '6.9-inch');
const fontDir = join(mobileRoot, 'assets', 'fonts');
const antonFont = join(fontDir, 'Anton-Regular.ttf');
const bodyFont = join(fontDir, 'ArchivoNarrow-Bold.ttf');
const tempDir = mkdtempSync(join(tmpdir(), 'boxing-coach-store-'));

const screenshots = [
  {
    output: '01-train-without-watching.png',
    source: '01-live-coaching.png',
    title: 'TRAIN WITHOUT\nWATCHING A SCREEN',
    support: 'Real-time combinations, bells, movement,\nand defense calls.',
  },
  {
    output: '02-real-combos-real-rounds.png',
    source: '02-workout-setup.png',
    title: 'REAL COMBOS.\nREAL ROUNDS.',
    support: 'Shadowboxing or heavy bag. Set your pace,\nthen put the phone down.',
  },
  {
    output: '03-a-workout-that-adapts.png',
    source: '03-adaptive-completion.png',
    title: 'A WORKOUT\nTHAT ADAPTS',
    support: 'Rate the session. Change one training\nvariable at a time.',
  },
  {
    output: '04-42-progressive-sessions.png',
    source: '04-premium-programs.png',
    title: '42 SESSIONS\nTHAT PROGRESS',
    support: 'Fundamentals, conditioning, and fight-camp\nstructure.',
    badge: 'PREMIUM',
  },
  {
    output: '05-see-every-round.png',
    source: '05-progress.png',
    title: 'SEE EVERY ROUND\nYOU EARN',
    support: 'Private local history. No account required.',
  },
  {
    output: '06-your-corner-your-profile.png',
    source: '06-profile.png',
    title: 'YOUR CORNER.\nYOUR PROFILE.',
    support: 'Goals, stance, equipment, schedule—and\noptional cloud sync.',
  },
];

function runMagick(args) {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'ImageMagick failed.');
  }
}

function roundedScreenshot(source, destination) {
  runMagick([
    source,
    '-background', '#050505',
    '-alpha', 'remove',
    '-resize', '950x2056!',
    '(',
    '-size', '950x2056',
    'xc:none',
    '-fill', 'white',
    '-draw', 'roundrectangle 0,0 949,2055 58,58',
    ')',
    '-alpha', 'off',
    '-compose', 'CopyOpacity',
    '-composite',
    destination,
  ]);
}

function renderScreenshot(definition, index) {
  const source = join(sourceDir, definition.source);
  const rounded = join(tempDir, `rounded-${index}.png`);
  const output = join(outputDir, definition.output);
  roundedScreenshot(source, rounded);

  const args = [
    '-size', '1320x2868',
    'gradient:#2b0005-#050505',
    '-gravity', 'NorthWest',
    '-fill', '#ff1d1d',
    '-draw', 'polygon 1140,0 1320,0 1320,180',
    '-font', antonFont,
    '-pointsize', '50',
    '-fill', '#ffbbae',
    '-annotate', '+88+82', `0${index + 1}  /  BOXING COACH`,
    '-font', antonFont,
    '-pointsize', '112',
    '-interline-spacing', '-12',
    '-fill', '#f7f2ef',
    '-annotate', '+88+175', definition.title,
    '-font', bodyFont,
    '-pointsize', '44',
    '-interline-spacing', '7',
    '-fill', '#d8cbc7',
    '-annotate', '+90+465', definition.support,
  ];

  if (definition.badge) {
    args.push(
      '-fill', '#ffbbae',
      '-draw', 'roundrectangle 965,552 1215,628 18,18',
      '-font', bodyFont,
      '-pointsize', '36',
      '-fill', '#111111',
      '-annotate', '+1018+570', definition.badge,
    );
  }

  args.push(
    '-fill', '#ffbbae',
    '-draw', 'roundrectangle 167,637 1153,2748 74,74',
    rounded,
    '-geometry', '+185+655',
    '-compose', 'Over',
    '-composite',
    '-background', '#050505',
    '-alpha', 'remove',
    '-depth', '8',
    `PNG24:${output}`,
  );

  runMagick(args);
  return output;
}

mkdirSync(outputDir, { recursive: true });

try {
  const outputs = screenshots.map(renderScreenshot);
  console.log(`Generated ${outputs.length} App Store screenshots:`);
  outputs.forEach(output => console.log(`- ${output}`));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
