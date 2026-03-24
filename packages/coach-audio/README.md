# Coach action audio (shared)

Place one MP3 per workout action: `<actionId>.mp3` (for example `b-1-2.mp3`).  
This folder is the **single source of truth** for web and mobile.

- **Web**: `apps/web/public/audio/coach` → symlink to this directory (URLs: `/audio/coach/<id>.mp3`).
- **Mobile**: `apps/mobile/assets/audio/coach` → symlink here; run `pnpm --filter @boxing-coach/mobile run generate:coach-registry` after adding files so Metro can `require()` them.

Generate clips from the core action list:

```bash
pnpm --filter @boxing-coach/core build
pnpm --filter @boxing-coach/web run generate:coach-audio
# With ElevenLabs:
ELEVEN_LABS_API_KEY=... pnpm --filter @boxing-coach/web run generate:coach-audio:elevenlabs
```
