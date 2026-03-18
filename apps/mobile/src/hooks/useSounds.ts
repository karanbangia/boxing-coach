import { useCallback, useEffect, useRef } from 'react';
import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';

function playFromStart(player: AudioPlayer) {
  void player
    .seekTo(0)
    .catch(() => {
      // Ignore seeks before initial load finishes.
    })
    .finally(() => {
      player.play();
    });
}

export function useSounds() {
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
    roundStartPlayer.volume = 0.85;
    roundEndPlayer.volume = 0.9;
    warningPlayer.volume = 0.45;
    freestylePlayer.volume = 0.65;

    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {
      // Silent-mode playback is best-effort.
    });
  }, [freestylePlayer, roundEndPlayer, roundStartPlayer, warningPlayer]);

  const roundStart = useCallback(() => {
    playFromStart(roundStartPlayer);
  }, [roundStartPlayer]);

  const roundEnd = useCallback(() => {
    playFromStart(roundEndPlayer);
  }, [roundEndPlayer]);

  const freestyleStart = useCallback(() => {
    playFromStart(freestylePlayer);
  }, [freestylePlayer]);

  const tenSecondWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastWarningRef.current < 800) {
      return;
    }

    lastWarningRef.current = now;
    playFromStart(warningPlayer);
  }, [warningPlayer]);

  return { roundStart, roundEnd, freestyleStart, tenSecondWarning };
}
