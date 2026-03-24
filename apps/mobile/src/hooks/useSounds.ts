import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
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

export function useSounds(sessionVolumeRef: MutableRefObject<number>) {
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
  const lastWarningRef = useRef(0);

  useEffect(() => {
    const mul = sessionVolumeRef.current;
    roundStartPlayer.volume = 0.85 * mul;
    roundEndPlayer.volume = 0.9 * mul;
    warningPlayer.volume = 0.45 * mul;
    freestylePlayer.volume = 0.65 * mul;

    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Silent-mode playback is best-effort.
    });
  }, [freestylePlayer, roundEndPlayer, roundStartPlayer, warningPlayer, sessionVolumeRef]);

  const roundStart = useCallback(() => {
    const mul = sessionVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(roundStartPlayer, 0.85 * mul);
  }, [roundStartPlayer, sessionVolumeRef]);

  const roundEnd = useCallback(() => {
    const mul = sessionVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(roundEndPlayer, 0.9 * mul);
  }, [roundEndPlayer, sessionVolumeRef]);

  const freestyleStart = useCallback(() => {
    const mul = sessionVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(freestylePlayer, 0.65 * mul);
  }, [freestylePlayer, sessionVolumeRef]);

  const tenSecondWarning = useCallback(() => {
    const mul = sessionVolumeRef.current;
    if (mul <= 0) return;
    const now = Date.now();
    if (now - lastWarningRef.current < 800) {
      return;
    }

    lastWarningRef.current = now;
    playFromStart(warningPlayer, 0.45 * mul);
  }, [warningPlayer, sessionVolumeRef]);

  return { roundStart, roundEnd, freestyleStart, tenSecondWarning };
}
