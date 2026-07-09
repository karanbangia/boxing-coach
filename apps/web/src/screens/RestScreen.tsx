interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  onSkipRest: () => void;
}

function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(wholeSeconds / 60);
  const s = wholeSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestScreen({ currentRound, totalRounds, timeRemaining, onSkipRest }: Props) {
  const nextRound = Math.min(currentRound + 1, totalRounds);

  return (
    <div className="relative h-full overflow-hidden bg-[var(--color-bg)] px-5 pb-6 text-[var(--color-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,20,20,0.3)_0%,rgba(19,19,19,0)_36%,rgba(19,19,19,0)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center">
        <div className="flex w-full items-start justify-between pt-4">
          <div>
            <div className="font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Round
            </div>
            <div className="font-['Anton'] text-4xl leading-none text-[var(--color-peach)]">
              {currentRound}
              <span className="text-[var(--color-text-muted)]">/{totalRounds}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Next up
            </div>
            <div className="mt-1 font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wide text-white">
              {nextRound === currentRound ? 'Final bell' : `Round ${nextRound}`}
            </div>
          </div>
        </div>

        <div className="mt-11 w-full text-center">
          <div className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Resting
          </div>
          <div className="mt-2 font-['Anton'] text-[52px] leading-[0.98] text-[var(--color-peach)]">
            CATCH YOUR BREATH
          </div>
          <div className="mx-auto mt-3 max-w-xs font-['Archivo_Narrow'] text-[17px] leading-6 text-[var(--color-text-muted)]">
            Shake out your arms. Slow nasal breath. Guard comes back up on the bell.
          </div>
        </div>

        <div className="mt-8 flex h-[286px] w-[286px] items-center justify-center" aria-label={`${formatTime(timeRemaining)} rest remaining`}>
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute h-64 w-64 rounded-full border-[3px] border-[rgba(255,20,20,0.24)] animate-pulse-ring" />
            <div className="absolute h-[244px] w-[244px] rounded-full border-2 border-[var(--color-border)]" />
            <div className="flex h-[202px] w-[202px] flex-col items-center justify-center rounded-full border-[10px] border-[var(--color-bg)] bg-[var(--color-accent)] shadow-2xl shadow-red-950/50">
              <span className="translate-y-1 font-['Anton'] text-[58px] leading-none tabular-nums text-white">
                {formatTime(timeRemaining)}
              </span>
              <span className="mt-1 font-['Space_Grotesk'] text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Rest left
              </span>
            </div>
          </div>
        </div>

        <div className="mt-1 flex min-h-[58px] w-full max-w-xs items-center border-2 border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex-1 text-center font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-peach)]">
            In 4
          </div>
          <div className="self-stretch border-l-2 border-[var(--color-border)]" />
          <div className="flex-1 text-center font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-peach)]">
            Out 6
          </div>
        </div>

        <button
          type="button"
          onClick={onSkipRest}
          className="mt-3 min-h-[58px] w-full max-w-xs border-2 border-[var(--color-accent)] bg-transparent font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform active:scale-[0.98]"
        >
          SKIP REST
        </button>
      </div>
    </div>
  );
}
