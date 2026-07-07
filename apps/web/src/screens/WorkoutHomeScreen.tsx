export function WorkoutHomeScreen({ onOpenTimer }: { onOpenTimer: () => void }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Workout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">READY ROOM</h1>
        </div>

        <div className="rounded-[1.75rem] border border-white/8 bg-[var(--color-surface)] p-5 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">Next up</p>
              <p className="mt-1 text-2xl font-black">3 Round Tune-Up</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-lg font-black text-white shadow-lg shadow-red-500/25">
              3
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {['2 MIN', '30s REST', 'BEGINNER'].map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--color-surface-2)] px-3 py-3 text-center text-[11px] font-black text-white">
                {item}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenTimer}
            className="mt-5 h-13 w-full rounded-2xl bg-white px-5 text-sm font-black text-[#0a0a0a] transition-transform active:scale-[0.98]"
          >
            SET TIMER
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-[var(--color-surface-2)] p-4">
            <p className="text-2xl font-black">0</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Rounds Today</p>
          </div>
          <div className="rounded-[1.5rem] bg-[var(--color-surface-2)] p-4">
            <p className="text-2xl font-black">0:00</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Bag Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
