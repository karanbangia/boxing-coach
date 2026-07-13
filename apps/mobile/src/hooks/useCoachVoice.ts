import type { Action } from '@boxing-coach/core';
import { getCoachPlaybackRate } from '@boxing-coach/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { coachRegistry } from '../lib/coachRegistry.generated';

export function useCoachVoice(masterVolume: number, audioCuesEnabled: boolean) {
  const player = useAudioPlayer(undefined, { keepAudioSessionActive: true });
  const masterVolumeRef = useRef(masterVolume);
  const audioCuesEnabledRef = useRef(audioCuesEnabled);

  masterVolumeRef.current = masterVolume;
  audioCuesEnabledRef.current = audioCuesEnabled;

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    player.volume = masterVolume;

    if (!audioCuesEnabled || masterVolume <= 0) {
      try {
        player.pause();
      } catch {
        /* ignore */
      }
    }
  }, [audioCuesEnabled, masterVolume, player]);

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
    if (
      !audioCuesEnabledRef.current ||
      masterVolumeRef.current <= 0 ||
      !player.isLoaded
    ) {
      return;
    }
    try {
      player.volume = masterVolumeRef.current;
      player.play();
    } catch {
      /* ignore */
    }
  }, [player]);

  const playAction = useCallback(
    (action: Action, currentRound: number, totalRounds: number) => {
      if (!audioCuesEnabledRef.current) return;
      const vol = masterVolumeRef.current;
      if (vol <= 0) return;

      const source = coachRegistry[action.id];
      if (source === undefined) return;

      const rate = getCoachPlaybackRate(action, currentRound, totalRounds);

      try {
        player.pause();
        player.replace(source);
        player.volume = vol;
        player.setPlaybackRate(rate);
        // Replacing the source starts the new clip at zero. Seeking here races
        // the new AVPlayerItem load on iOS and can prevent later cues playing.
        player.play();
      } catch {
        /* ignore */
      }
    },
    [player],
  );

  return useMemo(
    () => ({ playAction, pauseCoachAudio, resumeCoachAudio, stopCoachAudio }),
    [pauseCoachAudio, playAction, resumeCoachAudio, stopCoachAudio],
  );
}
