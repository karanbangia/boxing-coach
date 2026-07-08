export type AppTab = 'timer' | 'workout' | 'plan' | 'profile';

const tabs: { id: AppTab; label: string }[] = [
  { id: 'timer', label: 'TRAINING' },
  { id: 'workout', label: 'STATS' },
  { id: 'plan', label: 'PLANS' },
];

function TabIcon({ tab }: { tab: AppTab }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (tab === 'timer') {
    return (
      <svg {...common}>
        <path d="M10 2h4" />
        <path d="M12 14l3-3" />
        <path d="M12 6a8 8 0 108 8 8 8 0 00-8-8z" />
      </svg>
    );
  }

  if (tab === 'workout') {
    return (
      <svg {...common}>
        <path d="M7 8h10" />
        <path d="M7 16h10" />
        <path d="M5 10v4" />
        <path d="M19 10v4" />
        <path d="M3 12h2" />
        <path d="M19 12h2" />
      </svg>
    );
  }

  if (tab === 'plan') {
    return (
      <svg {...common}>
        <path d="M8 3v3" />
        <path d="M16 3v3" />
        <path d="M5 7h14" />
        <path d="M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
        <path d="M8 12h3" />
        <path d="M8 16h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

export function BottomTabBar({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] pt-3
        pointer-events-none
      "
      aria-label="Primary"
    >
      <div
        className="
          pointer-events-auto mx-auto grid max-w-[420px] grid-cols-3
          border-t-2 border-[#353535] bg-[#0e0e0e]
        "
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`
                group relative flex h-[61px] min-w-0 flex-col items-center justify-center gap-1
                border-t-4 font-['Space_Grotesk'] text-[10px] font-normal uppercase tracking-[0.1em] transition-colors duration-200
                ${active
                  ? 'border-[var(--color-peach)] text-[var(--color-peach)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-white'
                }
              `}
            >
              <span className="flex h-6 items-center justify-center">
                <TabIcon tab={tab.id} />
              </span>
              <span className="max-w-full truncate leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
