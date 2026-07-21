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
  const freestylePlayer = useAudioPlayer(
    require('../../assets/audio/freestyle.wav'),
    { keepAudioSessionActive: true },
  );
  const masterVolumeRef = useRef(masterVolume);
  const roundStartPlayTokenRef = useRef(0);

  masterVolumeRef.current = masterVolume;

  useEffect(() => {
    roundStartPlayer.volume = 0.85 * masterVolume;
    roundEndPlayer.volume = 0.9 * masterVolume;
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
  }, [freestylePlayer, masterVolume, roundEndPlayer, roundStartPlayer]);

  const roundStart = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    const playToken = ++roundStartPlayTokenRef.current;
    roundStartPlayer.volume = 0.85 * mul;
    void roundStartPlayer
      .seekTo(0)
      .catch(() => {})
      .finally(() => {
        if (playToken === roundStartPlayTokenRef.current) {
          roundStartPlayer.play();
        }
      });
  }, [roundStartPlayer]);

  const stopRoundStart = useCallback(() => {
    roundStartPlayTokenRef.current++;
    try {
      roundStartPlayer.pause();
      void roundStartPlayer.seekTo(0).catch(() => {});
    } catch {
      /* ignore */
    }
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

  return useMemo(
    () => ({ roundStart, stopRoundStart, roundEnd, freestyleStart }),
    [freestyleStart, roundEnd, roundStart, stopRoundStart],
  );
}
