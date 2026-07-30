import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { reportAudioFailure } from '../lib/observability';

function playFromStart(
  player: AudioPlayer,
  volume: number,
  cue: 'freestyle' | 'round_end',
) {
  player.volume = volume;
  void player
    .seekTo(0)
    .catch(error => {
      // Ignore seeks before initial load finishes.
      reportAudioFailure(error, cue, 'seek');
    })
    .finally(() => {
      try {
        player.play();
      } catch (error) {
        reportAudioFailure(error, cue, 'play');
      }
    });
}

export function useSounds(masterVolume: number) {
  const prepTickPlayer = useAudioPlayer(
    require('../../assets/audio/prep-tick.wav'),
    { keepAudioSessionActive: true },
  );
  const roundStartPlayer = useAudioPlayer(
    require('../../assets/audio/round-start.wav'),
    { keepAudioSessionActive: true },
  );
  const restCountdownPlayer = useAudioPlayer(
    require('../../assets/audio/rest-countdown.wav'),
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
  const prepTickPlayTokenRef = useRef(0);
  const roundStartPlayTokenRef = useRef(0);
  const restCountdownPlayTokenRef = useRef(0);

  masterVolumeRef.current = masterVolume;

  useEffect(() => {
    prepTickPlayer.volume = 0.55 * masterVolume;
    roundStartPlayer.volume = 0.85 * masterVolume;
    restCountdownPlayer.volume = 0.85 * masterVolume;
    roundEndPlayer.volume = 0.9 * masterVolume;
    freestylePlayer.volume = 0.65 * masterVolume;

    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(error => {
      reportAudioFailure(error, 'session', 'configure');
    });
  }, [
    freestylePlayer,
    masterVolume,
    prepTickPlayer,
    restCountdownPlayer,
    roundEndPlayer,
    roundStartPlayer,
  ]);

  const prepTick = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    const playToken = ++prepTickPlayTokenRef.current;
    prepTickPlayer.volume = 0.55 * mul;
    void prepTickPlayer
      .seekTo(0)
      .catch(error => {
        reportAudioFailure(error, 'prep_tick', 'seek');
      })
      .finally(() => {
        if (playToken === prepTickPlayTokenRef.current) {
          try {
            prepTickPlayer.play();
          } catch (error) {
            reportAudioFailure(error, 'prep_tick', 'play');
          }
        }
      });
  }, [prepTickPlayer]);

  const stopPrepTick = useCallback(() => {
    prepTickPlayTokenRef.current++;
    try {
      prepTickPlayer.pause();
      void prepTickPlayer.seekTo(0).catch(() => {});
    } catch (error) {
      reportAudioFailure(error, 'prep_tick', 'pause');
    }
  }, [prepTickPlayer]);

  const roundStart = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    const playToken = ++roundStartPlayTokenRef.current;
    roundStartPlayer.volume = 0.85 * mul;
    void roundStartPlayer
      .seekTo(0)
      .catch(error => {
        reportAudioFailure(error, 'round_start', 'seek');
      })
      .finally(() => {
        if (playToken === roundStartPlayTokenRef.current) {
          try {
            roundStartPlayer.play();
          } catch (error) {
            reportAudioFailure(error, 'round_start', 'play');
          }
        }
      });
  }, [roundStartPlayer]);

  const stopRoundStart = useCallback(() => {
    roundStartPlayTokenRef.current++;
    try {
      roundStartPlayer.pause();
      void roundStartPlayer.seekTo(0).catch(() => {});
    } catch (error) {
      reportAudioFailure(error, 'round_start', 'pause');
    }
  }, [roundStartPlayer]);

  const restCountdown = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    const playToken = ++restCountdownPlayTokenRef.current;
    restCountdownPlayer.volume = 0.85 * mul;
    void restCountdownPlayer
      .seekTo(0)
      .catch(error => {
        reportAudioFailure(error, 'rest_countdown', 'seek');
      })
      .finally(() => {
        if (playToken === restCountdownPlayTokenRef.current) {
          try {
            restCountdownPlayer.play();
          } catch (error) {
            reportAudioFailure(error, 'rest_countdown', 'play');
          }
        }
      });
  }, [restCountdownPlayer]);

  const stopRestCountdown = useCallback(() => {
    restCountdownPlayTokenRef.current++;
    try {
      restCountdownPlayer.pause();
      void restCountdownPlayer.seekTo(0).catch(() => {});
    } catch (error) {
      reportAudioFailure(error, 'rest_countdown', 'pause');
    }
  }, [restCountdownPlayer]);

  const roundEnd = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(roundEndPlayer, 0.9 * mul, 'round_end');
  }, [roundEndPlayer]);

  const freestyleStart = useCallback(() => {
    const mul = masterVolumeRef.current;
    if (mul <= 0) return;
    playFromStart(freestylePlayer, 0.65 * mul, 'freestyle');
  }, [freestylePlayer]);

  return useMemo(
    () => ({
      prepTick,
      stopPrepTick,
      roundStart,
      stopRoundStart,
      restCountdown,
      stopRestCountdown,
      roundEnd,
      freestyleStart,
    }),
    [
      freestyleStart,
      prepTick,
      restCountdown,
      roundEnd,
      roundStart,
      stopPrepTick,
      stopRestCountdown,
      stopRoundStart,
    ],
  );
}
