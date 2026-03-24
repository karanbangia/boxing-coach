import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { Action } from '@boxing-coach/core';
import { unlockHtmlAudioForCoach } from '../lib/unlockHtmlAudio';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentAction: Action | null;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
  muted: boolean;
  volumePercent: number;
  onVolumePercentChange: (percent: number) => void;
  onPause: () => void;
  onResume: () => void;
  onSkipRound: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function intensityColor(intensity: 'normal' | 'building' | 'intense', freestyle: boolean): string {
  if (freestyle) return 'var(--color-red)';
  switch (intensity) {
    case 'normal': return 'var(--color-green)';
    case 'building': return 'var(--color-yellow)';
    case 'intense': return 'var(--color-red)';
  }
}

function actionTypeStyle(type: string, freestyle: boolean) {
  if (freestyle) return 'text-[var(--color-accent)]';
  switch (type) {
    case 'movement': return 'text-blue-400';
    case 'defense': return 'text-amber-400';
    default: return 'text-white';
  }
}

function actionTypeBadge(type: string, freestyle: boolean) {
  if (freestyle) return 'FINISH STRONG';
  switch (type) {
    case 'movement': return 'MOVEMENT';
    case 'defense': return 'DEFENSE';
    default: return null;
  }
}

function IconSpeakerHigh({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 010 7M18.5 5.5a8.5 8.5 0 010 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSpeakerLow({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpeakerMuted({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M21 9l-6 6M15 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function percentFromPointerInTrack(el: HTMLElement, clientY: number): number {
  const rect = el.getBoundingClientRect();
  const y = clientY - rect.top;
  const t = 1 - y / rect.height;
  return Math.max(0, Math.min(100, Math.round(t * 100)));
}

interface CoachVolumeFillTrackProps {
  value: number;
  onChange: (percent: number) => void;
  autoFocus?: boolean;
}

function CoachVolumeFillTrack({ value, onChange, autoFocus }: CoachVolumeFillTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) trackRef.current?.focus();
  }, [autoFocus]);

  const applyClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      onChange(percentFromPointerInTrack(el, clientY));
    },
    [onChange],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    trackRef.current?.setPointerCapture(e.pointerId);
    applyClientY(e.clientY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!trackRef.current?.hasPointerCapture(e.pointerId)) return;
    applyClientY(e.clientY);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (trackRef.current?.hasPointerCapture(e.pointerId)) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(100, value + 5));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(0, value - 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(100);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      onChange(Math.min(100, value + 10));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      onChange(Math.max(0, value - 10));
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label="Coach volume"
      className="
        relative h-44 w-12 shrink-0 cursor-pointer rounded-full bg-[var(--color-surface-2)]
        overflow-hidden touch-none select-none outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--color-accent-glow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]
      "
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-[var(--color-accent)] pointer-events-none"
        style={{ height: `${value}%` }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-between py-2.5 pointer-events-none z-10">
        <IconSpeakerHigh className="text-white w-5 h-5 shrink-0" />
        <IconSpeakerLow className="text-white w-5 h-5 shrink-0" />
      </div>
    </div>
  );
}

export function WorkoutScreen({
  currentRound,
  totalRounds,
  timeRemaining,
  currentAction,
  intensity,
  isPaused,
  isFreestyle,
  actionKey,
  muted,
  volumePercent,
  onVolumePercentChange,
  onPause,
  onResume,
  onSkipRound,
  onStop,
}: Props) {
  const color = intensityColor(intensity, isFreestyle);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!volumeOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (volumeWrapRef.current?.contains(e.target as Node)) return;
      setVolumeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [volumeOpen]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Intensity bar at top */}
      <div
        className={`h-1 w-full transition-all duration-300 ${isFreestyle ? 'h-1.5' : ''}`}
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 gap-3">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
            Round
          </div>
          <div className="text-2xl font-black">
            {currentRound}<span className="text-[var(--color-text-muted)]">/{totalRounds}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
              {isFreestyle ? 'FINISH!' : 'Time'}
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color }}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div className="relative pt-0.5" ref={volumeWrapRef}>
            <button
              type="button"
              onClick={() => {
                unlockHtmlAudioForCoach();
                setVolumeOpen((o) => !o);
              }}
              className={`
                w-11 h-11 rounded-xl flex items-center justify-center
                bg-[var(--color-surface-2)] text-[var(--color-text-muted)]
                active:scale-95 transition-transform
                ${volumeOpen ? 'ring-2 ring-[var(--color-accent-glow)] text-white' : ''}
              `}
              aria-expanded={volumeOpen}
              aria-haspopup="dialog"
              aria-label="Volume"
            >
              {muted ? (
                <IconSpeakerMuted className="text-white" />
              ) : (
                <IconSpeakerHigh className="text-white" />
              )}
            </button>

            {volumeOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-surface-2)] shadow-xl px-4 py-3 flex flex-col items-center"
                role="dialog"
                aria-label="Volume"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">Coach</span>
                  <CoachVolumeFillTrack
                    value={volumePercent}
                    onChange={onVolumePercentChange}
                    autoFocus={volumeOpen}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main action display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isPaused ? (
          <div className="text-center">
            <div className="text-4xl font-black text-[var(--color-text-muted)] tracking-wider">
              PAUSED
            </div>
            <div className="text-sm text-[var(--color-text-muted)] mt-3">
              {formatTime(timeRemaining)} remaining
            </div>
          </div>
        ) : currentAction ? (
          <div key={actionKey} className="text-center animate-combo-flash">
            {actionTypeBadge(currentAction.type, isFreestyle) && (
              <div
                className={`text-xs font-bold tracking-[0.2em] mb-3 ${
                  isFreestyle ? 'text-[var(--color-accent)] animate-pulse' : actionTypeStyle(currentAction.type, false)
                }`}
              >
                {actionTypeBadge(currentAction.type, isFreestyle)}
              </div>
            )}
            <div
              className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-wider leading-tight ${actionTypeStyle(currentAction.type, isFreestyle)}`}
            >
              {currentAction.label}
            </div>
            <div className="text-base sm:text-lg text-[var(--color-text-muted)] mt-4 font-semibold">
              {currentAction.description}
            </div>
          </div>
        ) : (
          <div className="text-2xl font-bold text-[var(--color-text-muted)] tracking-wider">
            GET READY
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 pb-8 pt-4">
        <button
          onClick={() => {
            unlockHtmlAudioForCoach();
            onStop();
          }}
          className="
            w-14 h-14 rounded-full
            bg-[var(--color-surface-2)] text-[var(--color-text-muted)]
            flex items-center justify-center
            text-xs font-bold tracking-wider
            active:scale-90 transition-transform
          "
        >
          END
        </button>
        <button
          onClick={() => {
            unlockHtmlAudioForCoach();
            if (isPaused) onResume();
            else onPause();
          }}
          className="
            w-20 h-20 rounded-full
            bg-[var(--color-accent)] text-white
            flex items-center justify-center
            text-sm font-black tracking-wider
            shadow-lg shadow-red-500/30
            active:scale-90 transition-transform
          "
        >
          {isPaused ? 'GO' : 'PAUSE'}
        </button>
        <button
          type="button"
          onClick={() => {
            unlockHtmlAudioForCoach();
            onSkipRound();
          }}
          className="
            w-14 h-14 rounded-full
            bg-[var(--color-surface-2)] text-[var(--color-text-muted)]
            flex items-center justify-center
            text-[10px] font-bold tracking-wider leading-tight
            active:scale-90 transition-transform
          "
          aria-label="Skip round"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
