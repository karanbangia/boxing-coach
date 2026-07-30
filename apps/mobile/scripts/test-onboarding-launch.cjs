const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/lib/onboardingLaunch.ts');
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

const {
  nicknameFromDisplayName,
  resolveOnboardingLaunchDestination,
} = moduleObject.exports;

const stepsSourcePath = path.join(__dirname, '../src/lib/onboardingSteps.ts');
const stepsSource = fs.readFileSync(stepsSourcePath, 'utf8');
const stepsOutput = ts.transpileModule(stepsSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const stepsModule = { exports: {} };
new Function('module', 'exports', 'require', stepsOutput)(
  stepsModule,
  stepsModule.exports,
  require,
);
const {
  ONBOARDING_COMPLETED_STEP,
  migrateOnboardingStep,
} = stepsModule.exports;

const skippedRecord = {
  status: 'completed',
  step: ONBOARDING_COMPLETED_STEP,
  skipped: true,
  cloudOwnerUid: null,
};
const completedGuestRecord = {
  ...skippedRecord,
  skipped: false,
};

assert.equal(resolveOnboardingLaunchDestination({
  userId: null,
  accountProfileResolution: null,
  record: null,
}), 'welcome');
assert.equal(resolveOnboardingLaunchDestination({
  userId: null,
  accountProfileResolution: null,
  record: {
    ...skippedRecord,
    status: 'in_progress',
    step: 3,
    skipped: false,
  },
}), 'resume');
assert.equal(resolveOnboardingLaunchDestination({
  userId: null,
  accountProfileResolution: null,
  record: skippedRecord,
}), 'dashboard');

assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: skippedRecord,
}), 'account_setup');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: null,
}), 'account_setup');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: completedGuestRecord,
}), 'dashboard');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: {
    ...completedGuestRecord,
    cloudOwnerUid: 'account-a',
  },
}), 'dashboard');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'complete',
  record: skippedRecord,
}), 'dashboard');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'error',
  record: skippedRecord,
}), 'dashboard');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: {
    ...completedGuestRecord,
    cloudOwnerUid: 'account-b',
  },
}), 'account_setup');
assert.equal(resolveOnboardingLaunchDestination({
  userId: 'account-a',
  accountProfileResolution: 'missing',
  record: {
    ...completedGuestRecord,
    status: 'in_progress',
    step: 2,
    cloudOwnerUid: 'account-a',
  },
}), 'account_setup');

assert.equal(nicknameFromDisplayName('Karan Bangia'), 'Karan');
assert.equal(nicknameFromDisplayName('  Karan   Bangia  '), 'Karan');
assert.equal(nicknameFromDisplayName('Karan'), 'Karan');
assert.equal(nicknameFromDisplayName(''), '');
assert.equal(nicknameFromDisplayName(null), '');
assert.equal(nicknameFromDisplayName(undefined), '');

assert.equal(ONBOARDING_COMPLETED_STEP, 8);
assert.equal(migrateOnboardingStep(7, 'in_progress', 3), 3);
assert.equal(migrateOnboardingStep(6, 'in_progress', 3), 0);
assert.equal(migrateOnboardingStep(5, 'in_progress', 0), 0);
assert.equal(migrateOnboardingStep(5, 'in_progress', 4), 0);
assert.equal(migrateOnboardingStep(5, 'completed', 5), 8);
assert.equal(migrateOnboardingStep(4, 'in_progress', 3), 3);
assert.equal(migrateOnboardingStep(2, 'in_progress', 1), 2);

console.log('Validated onboarding launch, nickname, and step migration behavior.');
