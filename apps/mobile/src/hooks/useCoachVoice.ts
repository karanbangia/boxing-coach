import type { Action } from '@boxing-coach/core';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { coachRegistry } from '../lib/coachRegistry.generated';

function roundPlaybackRate(currentRound: number, totalRounds: number): number {
  if (totalRounds <= 0) return 1;
  const t = currentRound / totalRounds;
  return Math.min(1.4, 1 + 0.35 * t);
}

export function useCoachVoice(
  sessionVolumeRef: MutableRefObject<number>,
  audioCuesEnabledRef: MutableRefObject<boolean>,
) {
  const player = useAudioPlayer(undefined, { keepAudioSessionActive: true });

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  const stopCoachAudio = useCallback(() => {
    try {
      player.pause();
      void player.seekTo(0).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [player]);

  const pauseCoachAudio = useCallback(() => {
    try {
      player.pause();
    } catch {
      /* ignore */
    }
  }, [player]);

  const resumeCoachAudio = useCallback(() => {
    if (!player.isLoaded) return;
    try {
      player.volume = sessionVolumeRef.current;
      player.play();
    } catch {
      /* ignore */
    }
  }, [player, sessionVolumeRef]);

  const playAction = useCallback(
    (action: Action, currentRound: number, totalRounds: number) => {
      if (!audioCuesEnabledRef.current) return;
      const vol = sessionVolumeRef.current;
      if (vol <= 0) return;

      const source = coachRegistry[action.id];
      if (source === undefined) return;

      try {
        player.replace(source);
        player.playbackRate = roundPlaybackRate(currentRound, totalRounds);
        player.volume = vol;
        void player
          .seekTo(0)
          .catch(() => {})
          .finally(() => {
            player.play();
          });
      } catch {
        /* ignore */
      }
    },
    [audioCuesEnabledRef, player, sessionVolumeRef],
  );

  return useMemo(
    () => ({ playAction, pauseCoachAudio, resumeCoachAudio, stopCoachAudio }),
    [pauseCoachAudio, playAction, resumeCoachAudio, stopCoachAudio],
  );
}
