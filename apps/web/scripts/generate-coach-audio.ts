/**
 * Generates a manifest of all combo/movement/defense/freestyle actions for ElevenLabs TTS.
 * Writes MP3s into packages/coach-audio/ (shared with web + mobile).
 *
 * Usage:
 *   pnpm --filter @boxing-coach/core build
 *   pnpm exec tsx apps/web/scripts/generate-coach-audio.ts
 *   ELEVEN_LABS_API_KEY=... pnpm exec tsx apps/web/scripts/generate-coach-audio.ts --generate
 */

import { getProfile } from '@boxing-coach/core';
import type { Action, Difficulty } from '@boxing-coach/core';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const COACH_DIR = join(REPO_ROOT, 'packages', 'coach-audio');

const FREESTYLE_ACTIONS: Action[] = [
  { id: 'fs-1-2', type: 'combo', label: '1-2  1-2  1-2', description: 'Nonstop Jab - Cross', difficulty: 'beginner', durationMs: 1000 },
  { id: 'fs-1-1-2', type: 'combo', label: '1-1-2  1-1-2', description: 'Nonstop Jab - Jab - Cross', difficulty: 'beginner', durationMs: 1400 },
  { id: 'fs-freestyle', type: 'combo', label: 'FREESTYLE', description: 'Let your hands go!', difficulty: 'beginner', durationMs: 1000 },
  { id: 'fs-speed', type: 'combo', label: 'SPEED  1-2-1-2', description: 'Fast hands — empty the tank', difficulty: 'beginner', durationMs: 1000 },
];

function flattenActions(): Map<string, Action> {
  const byId = new Map<string, Action>();
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'pro'];

  for (const d of difficulties) {
    console.log(`[generate] Loading profile: ${d}`);
    const profile = getProfile(d);
    const pools = [
      ...profile.comboPools.initial,
      ...profile.comboPools.mid,
      ...profile.comboPools.late,
      ...profile.movementPools.initial,
      ...profile.movementPools.mid,
      ...profile.defensePools.initial,
      ...profile.defensePools.mid,
    ];
    console.log(`[generate]   ${d}: ${pools.length} actions from pools`);
    for (const a of pools) byId.set(a.id, a);
  }
  for (const a of FREESTYLE_ACTIONS) byId.set(a.id, a);
  console.log(`[generate] Total unique actions: ${byId.size}`);
  return byId;
}

interface ManifestEntry {
  id: string;
  text: string;
  path: string;
}

function buildManifest(): { actions: ManifestEntry[] } {
  const actions = Array.from(flattenActions().values()).map((a): ManifestEntry => ({
    id: a.id,
    text: a.description || a.label,
    path: `packages/coach-audio/${a.id}.mp3`,
  }));
  return { actions };
}

async function generateWithElevenLabs(apiKey: string, voiceId: string, entries: ManifestEntry[]): Promise<void> {
  const baseUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
  console.log(`[generate] ElevenLabs voice ID: ${voiceId}`);
  console.log(`[generate] Output dir: ${COACH_DIR}`);
  console.log(`[generate] Entries to generate: ${entries.length}`);

  if (!existsSync(COACH_DIR)) {
    console.log(`[generate] Creating coach dir: ${COACH_DIR}`);
    mkdirSync(COACH_DIR, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const outPath = join(REPO_ROOT, e.path);
    if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });

    if (existsSync(outPath)) {
      console.log(`[generate] [${i + 1}/${entries.length}] SKIP (exists) ${e.id} → ${e.path}`);
      skipCount++;
      continue;
    }

    const url = `${baseUrl}/${voiceId}?output_format=mp3_44100_128`;
    console.log(`[generate] [${i + 1}/${entries.length}] Requesting TTS for "${e.text}" (id=${e.id})`);

    const t0 = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({ text: e.text, model_id: 'eleven_multilingual_v2' }),
    });
    const elapsed = Date.now() - t0;

    if (!res.ok) {
      const err = await res.text();
      console.error(`[generate] [${i + 1}/${entries.length}] FAIL ${e.id}: HTTP ${res.status} (${elapsed}ms)`);
      console.error(`[generate]   Response: ${err}`);
      failCount++;
      continue;
    }

    const buf = await res.arrayBuffer();
    writeFileSync(outPath, Buffer.from(buf));
    successCount++;
    console.log(`[generate] [${i + 1}/${entries.length}] OK ${e.path} (${(buf.byteLength / 1024).toFixed(1)} KB, ${elapsed}ms)`);
  }

  console.log(`[generate] Summary: ${successCount} generated, ${skipCount} skipped, ${failCount} failed (total ${entries.length})`);
}

async function main(): Promise<void> {
  console.log('[generate] === Coach Audio Generator ===');
  console.log(`[generate] argv: ${process.argv.join(' ')}`);
  console.log(`[generate] COACH_DIR: ${COACH_DIR}`);
  console.log(`[generate] REPO_ROOT: ${REPO_ROOT}`);

  const manifest = buildManifest();
  const manifestPath = join(__dirname, 'coach-audio-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[generate] Wrote manifest → ${manifestPath}`);
  console.log(`[generate] Manifest contains ${manifest.actions.length} actions`);
  console.log(`[generate] Action IDs: ${manifest.actions.map(a => a.id).join(', ')}`);

  const doGenerate = process.argv.includes('--generate');
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM';

  if (!doGenerate) {
    console.log('[generate] Manifest-only mode (pass --generate to create MP3s)');
    return;
  }

  if (!apiKey) {
    console.error('[generate] ERROR: ELEVEN_LABS_API_KEY env var is not set');
    process.exit(1);
  }
  console.log(`[generate] API key present (length=${apiKey.length})`);
  console.log(`[generate] Voice ID: ${voiceId}`);
  console.log('[generate] Starting TTS generation...');
  await generateWithElevenLabs(apiKey, voiceId, manifest.actions);
  console.log('[generate] === Done ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
