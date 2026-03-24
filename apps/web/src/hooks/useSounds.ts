import { useCallback, useRef, type MutableRefObject } from 'react';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    console.log('[sounds] AudioContext created, state:', audioCtx.state, 'sampleRate:', audioCtx.sampleRate);
  }
  if (audioCtx.state === 'suspended') {
    console.log('[sounds] AudioContext suspended — resuming');
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  sessionMul = 1,
) {
  const mul = Math.max(0, Math.min(1, sessionMul));
  if (mul <= 0) return;

  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  const v = volume * mul;
  gain.gain.setValueAtTime(v, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function bellStrike(sessionMul: number) {
  playTone(800, 1.5, 'sine', 0.4, sessionMul);
  playTone(1200, 1.0, 'sine', 0.15, sessionMul);
  playTone(600, 1.2, 'sine', 0.1, sessionMul);
}

function tripleBell(sessionMul: number) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const mul = Math.max(0, Math.min(1, sessionMul));
  if (mul <= 0) return;

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.35 * mul, now + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.25);
    osc.stop(now + i * 0.25 + 0.8);
  }
}

function warningBeep(sessionMul: number) {
  playTone(500, 0.15, 'square', 0.15, sessionMul);
}

function freestyleSiren(sessionMul: number) {
  const mul = Math.max(0, Math.min(1, sessionMul));
  if (mul <= 0) return;

  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.12 * mul, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.7);
}

/** Bells scale with session volume + mute (0–1). */
export function useSounds(sessionVolumeRef: MutableRefObject<number>) {
  const lastWarningRef = useRef(0);

  const roundStart = useCallback(() => {
    console.log('[sounds] roundStart bell, vol:', sessionVolumeRef.current);
    bellStrike(sessionVolumeRef.current);
  }, [sessionVolumeRef]);

  const roundEnd = useCallback(() => {
    console.log('[sounds] roundEnd triple-bell, vol:', sessionVolumeRef.current);
    tripleBell(sessionVolumeRef.current);
  }, [sessionVolumeRef]);

  const freestyleStart = useCallback(() => {
    console.log('[sounds] freestyleStart siren, vol:', sessionVolumeRef.current);
    freestyleSiren(sessionVolumeRef.current);
  }, [sessionVolumeRef]);

  const tenSecondWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastWarningRef.current < 800) return;
    lastWarningRef.current = now;
    console.log('[sounds] 10s warning beep, vol:', sessionVolumeRef.current);
    warningBeep(sessionVolumeRef.current);
  }, [sessionVolumeRef]);

  return { roundStart, roundEnd, freestyleStart, tenSecondWarning };
}
