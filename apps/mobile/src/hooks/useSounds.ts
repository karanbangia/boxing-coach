import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';

function playFromStart(player: AudioPlayer, volume: number) {
  player.volume = volume;
  void player
    .seekTo(0)
    .catch(() => {
      // Ignore seeks before initial load finishes.
    })
    .finally(() => {
      player.play();
    });
}

export function useSounds(masterVolume: number) {
  const roundStartPlayer = useAudioPlayer(
    require('../../assets/audio/round-start.wav'),
    { keepAudioSessionActive: true },
  );
  const roundEndPlayer = useAudioPlayer(
    require('../../assets/audio/round-end.wav'),
    { keepAudioSessionActive: true },
  );
  const warningPlayer = useAudioPlayer(
    require('../../assets/audio/warning.wav'),
    { keepAudioSessionActive: true },
  );
  const freestylePlayer = useAudioPlayer(
    require('../../assets/audio/freestyle.wav'),
    { keepAudioSessionActive: true },
  );
  const masterVolumeRef = useRef(masterVolume);
  const lastWarningRef = useRef(0);

  masterVolumeRef.current = masterVolume;

  useEffect(() => {
    roundStartPlayer.volume = 0.85 * masterVolume;
    roundEndPlayer.volume = 0.9 * masterVolume;
    warningPlayer.volume = 0.45 * masterVolume;
    freestylePlayer.volume = 0.65 * masterVolume;

    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Silent-mode playback is best-effort.
    });
  }, [freestylePlayer, masterVolume, roundEndPlayer, roundStartPlayer, warningPlayer]);

  const roundStart = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(roundStartPlayer, 0.85 * mul);
  }, [roundStartPlayer]);

  const roundEnd = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(roundEndPlayer, 0.9 * mul);
  }, [roundEndPlayer]);

  const freestyleStart = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(freestylePlayer, 0.65 * mul);
  }, [freestylePlayer]);

  const tenSecondWarning = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    const now = Date.now();
    if (now - lastWarningRef.current < 800) {
      return;
    }

    lastWarningRef.current = now;
    playFromStart(warningPlayer, 0.45 * mul);
  }, [warningPlayer]);

  return useMemo(
    () => ({ roundStart, roundEnd, freestyleStart, tenSecondWarning }),
    [freestyleStart, roundEnd, roundStart, tenSecondWarning],
  );
}
