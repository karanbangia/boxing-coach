const profileStats = [
  ['0', 'Total Rounds'],
  ['0', 'Workouts'],
  ['0', 'Day Streak'],
  ['Beginner', 'Level'],
];

export function ProfileScreen() {
  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-black text-[#0a0a0a]">BC</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Profile</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">FIGHTER</h1>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {profileStats.map(([value, label]) => (
            <div key={label} className="rounded-[1.5rem] bg-[var(--color-surface)] p-4">
              <p className="text-2xl font-black">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
