// Metro must watch the monorepo so static requires can resolve MP3s in packages/coach-audio.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
// Sentry's Metro wrapper adds debug IDs so production errors can be matched to
// source maps. Uploading remains disabled until SENTRY_ORG, SENTRY_PROJECT, and
// SENTRY_AUTH_TOKEN are configured in the build environment.
const config = getSentryExpoConfig(projectRoot, {
  includeWebReplay: false,
});

config.watchFolders = [...new Set([...(config.watchFolders ?? []), monorepoRoot])];

module.exports = config;
