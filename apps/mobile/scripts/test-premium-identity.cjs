const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '../src/lib/premiumIdentity.ts');
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
  actionStatusUnlocksPremium,
  hasPremiumAccess,
  resolvePendingPremiumAction,
} = moduleObject.exports;

assert.equal(actionStatusUnlocksPremium('unlocked'), true);
assert.equal(actionStatusUnlocksPremium('cancelled'), false);
assert.equal(actionStatusUnlocksPremium('failed'), false);

assert.equal(hasPremiumAccess({
  firebaseUid: null,
  revenueCatAppUserId: '$RCAnonymousID:guest',
  entitlementActive: true,
}), false);
assert.equal(hasPremiumAccess({
  firebaseUid: 'account-a',
  revenueCatAppUserId: 'account-b',
  entitlementActive: true,
}), false);
assert.equal(hasPremiumAccess({
  firebaseUid: 'account-a',
  revenueCatAppUserId: 'account-a',
  entitlementActive: false,
}), false);
assert.equal(hasPremiumAccess({
  firebaseUid: 'account-a',
  revenueCatAppUserId: 'account-a',
  entitlementActive: true,
}), true);

assert.deepEqual(resolvePendingPremiumAction({
  pendingAction: 'purchase',
  identityState: 'syncing',
  isPremium: false,
}), {
  pendingAction: 'purchase',
  effect: 'wait',
});
assert.deepEqual(resolvePendingPremiumAction({
  pendingAction: 'purchase',
  identityState: 'error',
  isPremium: false,
}), {
  pendingAction: 'purchase',
  effect: 'wait',
});
assert.deepEqual(resolvePendingPremiumAction({
  pendingAction: 'purchase',
  identityState: 'identified',
  isPremium: true,
}), {
  pendingAction: null,
  effect: 'unlock',
});
assert.deepEqual(resolvePendingPremiumAction({
  pendingAction: 'purchase',
  identityState: 'identified',
  isPremium: false,
}), {
  pendingAction: null,
  effect: 'purchase',
});
assert.deepEqual(resolvePendingPremiumAction({
  pendingAction: 'restore',
  identityState: 'identified',
  isPremium: false,
}), {
  pendingAction: null,
  effect: 'restore',
});

console.log('Validated Premium identity matching and pending-action transitions.');
