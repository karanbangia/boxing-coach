interface Props {
  secondsLeft: number;
  totalRounds: number;
  onSkip: () => void;
  onCancel: () => void;
}

export function PrepScreen({ secondsLeft, totalRounds, onSkip, onCancel }: Props) {
  return (
    <div className="h-full min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[var(--color-bg)] text-white">
      <p className="text-xs font-bold tracking-[0.2em] text-[var(--color-text-muted)] mb-2">GET READY</p>
      <h1 className="text-5xl sm:text-7xl font-black tabular-nums tracking-tight mb-4">{secondsLeft}</h1>
      <p className="text-center text-sm text-[var(--color-text-muted)] max-w-xs mb-2">
        Strap in, wrap up, gloves on — round 1 of {totalRounds} starts when the timer hits zero.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-4 rounded-xl font-black tracking-wider bg-[var(--color-accent)] text-black active:opacity-90"
        >
          START NOW
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-xl font-bold tracking-wide text-[var(--color-text-muted)] border border-[var(--color-surface-2)]"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
