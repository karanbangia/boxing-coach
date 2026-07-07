const plannedWorkouts = [
  ['Mon', 'Bag Basics', '3 rounds'],
  ['Wed', 'Defense Builder', '4 rounds'],
  ['Fri', 'Power Finish', '6 rounds'],
];

export function PlanScreen() {
  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Plan</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">THIS WEEK</h1>

        <div className="mt-7 space-y-3">
          {plannedWorkouts.map(([day, title, meta], i) => (
            <div key={day} className="flex items-center gap-4 rounded-[1.5rem] bg-[var(--color-surface)] p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black ${i === 0 ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'}`}>
                {day}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black">{title}</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--color-text-muted)]">{meta}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-white/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
