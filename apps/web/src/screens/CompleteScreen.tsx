interface Props {
  totalRounds: number;
  roundDuration: number;
  onRestart: () => void;
}

export function CompleteScreen({ totalRounds, roundDuration, onRestart }: Props) {
  const totalMinutes = Math.round((totalRounds * roundDuration) / 60);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-4">&#x1F94A;</div>
        <h2 className="text-3xl font-black tracking-tight mb-2">WORKOUT</h2>
        <h2 className="text-3xl font-black tracking-tight text-[var(--color-accent)] mb-6">COMPLETE</h2>

        <div className="flex gap-6 justify-center mb-10">
          <div className="text-center">
            <div className="text-3xl font-black">{totalRounds}</div>
            <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
              Rounds
            </div>
          </div>
          <div className="w-px bg-[var(--color-surface-2)]" />
          <div className="text-center">
            <div className="text-3xl font-black">{totalMinutes}</div>
            <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
              Minutes
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="
            px-10 py-4 rounded-2xl text-lg font-black tracking-wider
            bg-[var(--color-accent)] text-white
            shadow-lg shadow-red-500/30
            active:scale-[0.95] transition-transform
          "
        >
          GO AGAIN
        </button>
      </div>
    </div>
  );
}
