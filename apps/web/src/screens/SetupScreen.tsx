import { useEffect, useState } from 'react';
import type { Difficulty, EngineConfig } from '@boxing-coach/core';
import { loadTuning } from '../lib/storage';

const STORAGE_KEY = 'boxing-coach-settings';

interface SavedSettings {
  difficulty: Difficulty;
  roundDuration: number;
  totalRounds: number;
  restDuration: number;
}

function loadSettings(): SavedSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSettings;
  } catch {
    return null;
  }
}

function saveSettings(s: SavedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota exceeded, ignore */ }
}

interface Props {
  onStart: (config: EngineConfig) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'beginner', label: 'BEGINNER', desc: 'Jabs & crosses, slow pace' },
  { value: 'intermediate', label: 'INTERMEDIATE', desc: 'Adds hooks, moderate build' },
  { value: 'advanced', label: 'ADVANCED', desc: 'All punches, fast ramp up' },
];

const ROUND_DURATIONS = [
  { value: 120, label: '2 MIN' },
  { value: 180, label: '3 MIN' },
];

const TOTAL_ROUNDS = [
  { value: 3, label: '3' },
  { value: 6, label: '6' },
  { value: 9, label: '9' },
  { value: 12, label: '12' },
];

const REST_DURATIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] mb-3 uppercase">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`
                px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${selected
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-red-500/20'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/80'
                }
              `}
            >
              {opt.label}
              {opt.desc && (
                <span className={`block text-[10px] font-normal mt-0.5 ${selected ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                  {opt.desc}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SetupScreen({ onStart }: Props) {
  const saved = loadSettings();
  const [difficulty, setDifficulty] = useState<Difficulty>(saved?.difficulty ?? 'beginner');
  const [roundDuration, setRoundDuration] = useState(saved?.roundDuration ?? 120);
  const [totalRounds, setTotalRounds] = useState(saved?.totalRounds ?? 3);
  const [restDuration, setRestDuration] = useState(saved?.restDuration ?? 30);
  useEffect(() => {
    saveSettings({ difficulty, roundDuration, totalRounds, restDuration });
  }, [difficulty, roundDuration, totalRounds, restDuration]);

  const handleStart = () => {
    const tuning = loadTuning();
    const hasOverrides = Object.values(tuning).some(v => v !== undefined);
    onStart({
      difficulty,
      roundDuration,
      totalRounds,
      restDuration,
      ...(hasOverrides ? { tuning } : {}),
    });
  };

  return (
    <div className="h-full flex flex-col px-6 py-8 max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">BOXING</h1>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-accent)]">COACH</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Set up your workout and hit the bag.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <OptionGroup
          label="Difficulty"
          options={DIFFICULTIES}
          value={difficulty}
          onChange={setDifficulty}
        />
        <OptionGroup
          label="Round Duration"
          options={ROUND_DURATIONS}
          value={roundDuration}
          onChange={setRoundDuration}
        />
        <OptionGroup
          label="Rounds"
          options={TOTAL_ROUNDS}
          value={totalRounds}
          onChange={setTotalRounds}
        />
        <OptionGroup
          label="Rest Between Rounds"
          options={REST_DURATIONS}
          value={restDuration}
          onChange={setRestDuration}
        />
      </div>

      <button
        onClick={handleStart}
        className="
          w-full py-5 rounded-2xl text-xl font-black tracking-wider
          bg-[var(--color-accent)] text-white
          shadow-lg shadow-red-500/30
          active:scale-[0.97] transition-transform
          mt-6
        "
      >
        START WORKOUT
      </button>
    </div>
  );
}
