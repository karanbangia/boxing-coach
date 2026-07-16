interface Props {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onCancel: () => void;
}

const RING_SIZE = 178;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function PrepScreen({ secondsLeft, totalSeconds, onSkip, onCancel }: Props) {
  const progress = Math.max(0, Math.min(1, secondsLeft / Math.max(1, totalSeconds)));
  const progressOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col items-center justify-between overflow-hidden bg-[var(--color-bg)] px-6 pb-[42px] pt-12 text-white">
      <div className="relative flex w-full max-w-[340px] flex-col items-center">
        <div className="py-1 text-center font-['Anton'] uppercase">
          <div className="text-[46px] leading-[56px] text-[var(--color-peach)]">GET</div>
          <div className="-mt-2.5 text-[52px] leading-[64px] text-[var(--color-accent)]">READY!</div>
        </div>

        <div className="mt-[27px] mb-[15px] font-['Barlow_Semi_Condensed'] text-[10px] font-semibold uppercase leading-[13px] tracking-[0.24em] text-[var(--color-text-muted)]">
          Round starts in
        </div>

        <div className="relative mb-8 flex h-[178px] w-[178px] items-center justify-center rounded-full">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,20,20,0.18)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={progressOffset}
              style={{ transition: 'stroke-dashoffset 1000ms linear' }}
            />
          </svg>
          <div className="translate-y-1.5 font-['Anton'] text-[72px] leading-[94px] tabular-nums text-white">
            {secondsLeft}
          </div>
        </div>

        <p className="text-center font-['Archivo_Narrow'] text-[26px] font-bold leading-[29px] text-[var(--color-text-muted)]">
          Gloves up. Find<br />your stance.
        </p>
      </div>

      <div className="relative w-full max-w-[336px]">
        <button
          type="button"
          onClick={onSkip}
          className="flex min-h-[58px] w-full items-center justify-center gap-2 bg-[var(--color-accent)] font-['Anton'] text-[26px] leading-8 text-white active:scale-[0.99] active:opacity-90"
          aria-label="Start now"
        >
          <span className="h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
          <span className="translate-y-0.5">START NOW</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-2.5 flex min-h-14 w-full items-center justify-center gap-2 border border-[var(--color-border)] bg-[rgba(26,26,26,0.64)] font-['Barlow_Semi_Condensed'] font-semibold uppercase text-[var(--color-text-muted)] active:scale-[0.99] active:opacity-90"
          aria-label="Cancel workout"
        >
          <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
            <span className="absolute h-0.5 w-3 rounded-full bg-[var(--color-text-muted)] rotate-45" />
            <span className="absolute h-0.5 w-3 rounded-full bg-[var(--color-text-muted)] -rotate-45" />
          </span>
          <span className="text-sm leading-[18px] tracking-[0.16em]">CANCEL WORKOUT</span>
        </button>
      </div>
    </div>
  );
}
