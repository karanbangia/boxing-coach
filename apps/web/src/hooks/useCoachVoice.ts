import type { Action } from '@boxing-coach/core';
import { isFreestyleFinisherId } from '@boxing-coach/core';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { alog } from '../lib/audioLog';

function coachUrlForAction(action: Action): string {
  return action.audioSrc ?? `/audio/coach/${action.id}.mp3`;
}

function roundPlaybackRate(currentRound: number, totalRounds: number): number {
  if (totalRounds <= 0) return 1;
  const t = currentRound / totalRounds;
  return Math.min(1.4, 1 + 0.35 * t);
}

const badUrls = new Set<string>();

export function useCoachVoice(
  sessionVolumeRef: MutableRefObject<number>,
  audioCuesEnabledRef: MutableRefObject<boolean>,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastErrCbRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.muted = false;
    el.setAttribute('playsInline', '');
    Object.assign(el.style, {
      position: 'fixed',
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.appendChild(el);
    audioRef.current = el;
    alog('el:created', {}, el);

    const tracked = [
      'play', 'pause', 'ended', 'emptied', 'stalled',
      'waiting', 'canplay', 'canplaythrough', 'suspend', 'abort',
    ] as const;
    const handlers = tracked.map((name) => {
      const h = () => alog(`el:${name}`, {}, el);
      el.addEventListener(name, h);
      return [name, h] as const;
    });

    return () => {
      for (const [name, h] of handlers) el.removeEventListener(name, h);
      el.pause();
      el.src = '';
      el.remove();
      audioRef.current = null;
      alog('el:destroyed');
    };
  }, []);

  function resetElement(el: HTMLAudioElement) {
    if (lastErrCbRef.current) {
      el.removeEventListener('error', lastErrCbRef.current);
      lastErrCbRef.current = null;
    }
    el.pause();
    el.removeAttribute('src');
    el.load();
  }

  function applyClip(
    el: HTMLAudioElement,
    action: Action,
    currentRound: number,
    totalRounds: number,
    vol: number,
    label: string,
  ) {
    const url = coachUrlForAction(action);

    if (badUrls.has(url)) {
      alog('applyClip:skip-missing', { actionId: action.id, url });
      return;
    }

    const isFinisher = isFreestyleFinisherId(action.id);
    const rate = isFinisher ? 1 : roundPlaybackRate(currentRound, totalRounds);

    alog('applyClip:start', {
      label, actionId: action.id, actionType: action.type, url, volume: vol, playbackRate: rate,
      round: currentRound, totalRounds,
    }, el);

    resetElement(el);

    el.muted = false;
    el.src = url;
    el.playbackRate = rate;
    el.volume = vol;

    alog('applyClip:src-set', { url }, el);

    const onErr = () => {
      alog('applyClip:error', { url, errorCode: el.error?.code, errorMsg: el.error?.message }, el);
      badUrls.add(url);
      resetElement(el);
    };
    el.addEventListener('error', onErr, { once: true });
    lastErrCbRef.current = onErr;

    void el
      .play()
      .then(() => {
        alog('applyClip:play-ok', { actionId: action.id, url }, el);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        alog('applyClip:play-rejected', { actionId: action.id, url, err: msg }, el);
      });
  }

  const stopCoachAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    alog('stop', {}, el);
    el.pause();
    el.currentTime = 0;
    if (lastErrCbRef.current) {
      el.removeEventListener('error', lastErrCbRef.current);
      lastErrCbRef.current = null;
    }
    el.removeAttribute('src');
    el.load();
  }, []);

  const pauseCoachAudio = useCallback(() => {
    alog('pause', {}, audioRef.current);
    audioRef.current?.pause();
  }, []);

  const resumeOrReplayCoachAudio = useCallback(
    (action: Action, currentRound: number, totalRounds: number) => {
      const cuesEnabled = audioCuesEnabledRef.current;
      const vol = sessionVolumeRef.current;
      const el = audioRef.current;

      alog('resumeOrReplay:enter', {
        actionId: action.id, cuesEnabled, vol, hasSrc: !!el?.src,
        round: currentRound, totalRounds,
      }, el);

      if (!cuesEnabled) return;
      if (vol <= 0) return;
      if (!el) return;

      if (!el.src) {
        alog('resumeOrReplay:reload', { actionId: action.id }, el);
        applyClip(el, action, currentRound, totalRounds, vol, 'resumeOrReplay→applyClip');
        return;
      }
      el.volume = vol;
      el.muted = false;
      void el.play().catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        alog('resumeOrReplay:play-rejected', { actionId: action.id, err: msg }, el);
      });
    },
    [audioCuesEnabledRef, sessionVolumeRef],
  );

  const playAction = useCallback(
    (action: Action, currentRound: number, totalRounds: number) => {
      const cuesEnabled = audioCuesEnabledRef.current;
      const vol = sessionVolumeRef.current;
      const el = audioRef.current;

      if (!cuesEnabled) {
        alog('playAction:skip-cues-disabled', { actionId: action.id });
        return;
      }
      if (vol <= 0) {
        alog('playAction:skip-vol-zero', { actionId: action.id, vol });
        return;
      }
      if (!el) {
        alog('playAction:skip-no-el', { actionId: action.id });
        return;
      }

      applyClip(el, action, currentRound, totalRounds, vol, 'playAction');
    },
    [audioCuesEnabledRef, sessionVolumeRef],
  );

  return useMemo(
    () => ({
      playAction,
      pauseCoachAudio,
      resumeOrReplayCoachAudio,
      stopCoachAudio,
    }),
    [playAction, pauseCoachAudio, resumeOrReplayCoachAudio, stopCoachAudio],
  );
}
