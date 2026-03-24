/**
 * Ring-buffer event logger for debugging coach audio playback.
 *
 * Usage (browser console):
 *   __dumpAudioLog()        → copy-pasteable JSON of the last 500 events
 *   __dumpAudioLog(true)    → same, but also copies to clipboard
 *   __audioLog              → raw array (inspect in DevTools)
 */

export interface AudioLogEntry {
  t: number;
  ts: string;
  event: string;
  detail?: Record<string, unknown>;
  elState?: {
    src: string;
    readyState: number;
    networkState: number;
    paused: boolean;
    muted: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    error: string | null;
    ended: boolean;
  };
}

const MAX_ENTRIES = 500;
const log: AudioLogEntry[] = [];
const t0 = Date.now();

function elSnapshot(el: HTMLAudioElement | null): AudioLogEntry['elState'] | undefined {
  if (!el) return undefined;
  return {
    src: el.src,
    readyState: el.readyState,
    networkState: el.networkState,
    paused: el.paused,
    muted: el.muted,
    volume: el.volume,
    currentTime: el.currentTime,
    duration: el.duration,
    error: el.error
      ? `code=${el.error.code} msg=${el.error.message}`
      : null,
    ended: el.ended,
  };
}

export function alog(
  event: string,
  detail?: Record<string, unknown>,
  el?: HTMLAudioElement | null,
) {
  const now = Date.now();
  const entry: AudioLogEntry = {
    t: now - t0,
    ts: new Date(now).toISOString(),
    event,
    ...(detail && Object.keys(detail).length > 0 ? { detail } : {}),
    ...(el !== undefined ? { elState: elSnapshot(el) } : {}),
  };
  log.push(entry);
  if (log.length > MAX_ENTRIES) log.shift();

  const style = entry.event.includes('error') || entry.event.includes('rejected')
    ? 'color:#ff4d4f;font-weight:bold'
    : entry.event.includes('skip') || entry.event.includes('stop')
      ? 'color:#faad14'
      : 'color:#52c41a';
  console.log(
    `%c[audio] %c${entry.event}`,
    'color:#888',
    style,
    entry.detail ?? '',
    entry.elState ?? '',
  );
}

function dumpAudioLog(copyToClipboard = false): string {
  const json = JSON.stringify(log, null, 2);
  if (copyToClipboard && navigator.clipboard) {
    navigator.clipboard.writeText(json).then(
      () => console.log(`[audio-log] Copied ${log.length} entries to clipboard.`),
      () => console.warn('[audio-log] Clipboard write failed — use the returned string.'),
    );
  }
  console.log(`[audio-log] ${log.length} entries (${(json.length / 1024).toFixed(1)} KB)`);
  return json;
}

// Expose globally
declare global {
  interface Window {
    __audioLog: AudioLogEntry[];
    __dumpAudioLog: typeof dumpAudioLog;
  }
}
window.__audioLog = log;
window.__dumpAudioLog = dumpAudioLog;
