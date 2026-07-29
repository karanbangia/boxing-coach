const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/features/programs/programs.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', 'require', output)(
  moduleObject,
  moduleObject.exports,
  require,
);

const { BOXING_PROGRAMS } = moduleObject.exports;
assert.equal(BOXING_PROGRAMS.length, 3);
assert.deepEqual(
  BOXING_PROGRAMS.map(program => program.sessions.length),
  [6, 12, 24],
);
assert.equal(
  BOXING_PROGRAMS.reduce((total, program) => total + program.sessions.length, 0),
  42,
);

const ids = new Set();
for (const program of BOXING_PROGRAMS) {
  assert.equal(program.sessions.length, program.weeks * program.sessionsPerWeek);
  program.sessions.forEach((session, index) => {
    assert.equal(session.sequence, index + 1);
    assert.equal(session.programId, program.id);
    assert.ok(!ids.has(session.id), `Duplicate program session id: ${session.id}`);
    ids.add(session.id);
    assert.ok(session.settings.totalRounds >= 1 && session.settings.totalRounds <= 12);
    assert.ok([120, 180].includes(session.settings.roundDuration));
    assert.ok([30, 60].includes(session.settings.restDuration));
    assert.ok(['shadowboxing', 'heavy_bag'].includes(session.settings.trainingMode));
    assert.ok((session.tuning.intervalBase ?? 0) >= 1300);
  });
}

console.log('Validated 3 programs and 42 unique progressive sessions.');
