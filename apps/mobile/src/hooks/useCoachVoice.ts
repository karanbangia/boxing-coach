import type { Action } from '@boxing-coach/core';
import { getCoachPlaybackRate } from '@boxing-coach/core';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { coachRegistry } from '../lib/coachRegistry.generated';

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

      const rate = getCoachPlaybackRate(action, currentRound, totalRounds);

      try {
        player.replace(source);
        player.playbackRate = rate;
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
