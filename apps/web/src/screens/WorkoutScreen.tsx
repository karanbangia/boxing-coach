import type { Action } from '@boxing-coach/core';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentAction: Action | null;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
  onPause: () => void;
  onResume: () => void;
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

export function WorkoutScreen({
  currentRound,
  totalRounds,
  timeRemaining,
  currentAction,
  intensity,
  isPaused,
  isFreestyle,
  actionKey,
  onPause,
  onResume,
  onStop,
}: Props) {
  const color = intensityColor(intensity, isFreestyle);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Intensity bar at top */}
      <div
        className={`h-1 w-full transition-all duration-300 ${isFreestyle ? 'h-1.5' : ''}`}
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
            Round
          </div>
          <div className="text-2xl font-black">
            {currentRound}<span className="text-[var(--color-text-muted)]">/{totalRounds}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
            {isFreestyle ? 'FINISH!' : 'Time'}
          </div>
          <div className="text-2xl font-black tabular-nums" style={{ color }}>
            {formatTime(timeRemaining)}
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
          onClick={onStop}
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
          onClick={isPaused ? onResume : onPause}
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
        <div className="w-14 h-14" />
      </div>
    </div>
  );
}
