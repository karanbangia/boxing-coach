import { useCallback, useRef } from 'react';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function bellStrike() {
  playTone(800, 1.5, 'sine', 0.4);
  playTone(1200, 1.0, 'sine', 0.15);
  playTone(600, 1.2, 'sine', 0.1);
}

function tripleBell() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.35, now + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.25);
    osc.stop(now + i * 0.25 + 0.8);
  }
}

function warningBeep() {
  playTone(500, 0.15, 'square', 0.15);
}

function freestyleSiren() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.7);
}

export function useSounds() {
  const lastWarningRef = useRef(0);

  const roundStart = useCallback(() => {
    bellStrike();
  }, []);

  const roundEnd = useCallback(() => {
    tripleBell();
  }, []);

  const freestyleStart = useCallback(() => {
    freestyleSiren();
  }, []);

  const tenSecondWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastWarningRef.current < 800) return;
    lastWarningRef.current = now;
    warningBeep();
  }, []);

  return { roundStart, roundEnd, freestyleStart, tenSecondWarning };
}
