interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  onSkipRest: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.ceil(seconds);
  return `${s}`;
}

export function RestScreen({ currentRound, totalRounds, timeRemaining, onSkipRest }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 relative">
      <div className="text-center">
        <div className="text-sm font-bold tracking-[0.3em] text-[var(--color-text-muted)] uppercase mb-2">
          Round {currentRound} Complete
        </div>

        <div className="text-lg font-semibold text-[var(--color-text-muted)] mb-8">
          Rest up — Round {currentRound + 1} of {totalRounds} next
        </div>

        <div className="flex items-center justify-center mb-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full border-2 border-[var(--color-accent)]/20 animate-pulse-ring" />
            <div className="w-32 h-32 rounded-full bg-[var(--color-surface)] flex items-center justify-center border-2 border-[var(--color-accent)]/40">
              <span className="text-5xl font-black tabular-nums text-[var(--color-accent)]">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onSkipRest}
          className="
            px-10 py-4 rounded-2xl text-lg font-black tracking-wider
            bg-[var(--color-accent)] text-white
            shadow-lg shadow-red-500/30
            active:scale-[0.95] transition-transform
          "
        >
          SKIP REST
        </button>
      </div>
    </div>
  );
}
