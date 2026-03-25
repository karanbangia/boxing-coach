import { useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, EngineConfig } from "@boxing-coach/core";

export type StartWorkoutPayload = EngineConfig & { audioCuesEnabled: boolean };
import { loadTuning } from "../lib/storage";

const STORAGE_KEY = "boxing-coach-settings";

interface SavedSettings {
  difficulty: Difficulty;
  roundDuration: number;
  totalRounds: number;
  restDuration: number;
  /** When false, coach MP3s are not played during the workout. */
  audioCuesEnabled?: boolean;
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
  } catch {
    /* quota exceeded, ignore */
  }
}

interface Props {
  onStart: (payload: StartWorkoutPayload) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "beginner", label: "BEGINNER", desc: "Jabs & crosses, slow pace" },
  {
    value: "intermediate",
    label: "INTERMEDIATE",
    desc: "Adds hooks, moderate build",
  },
  { value: "advanced", label: "ADVANCED", desc: "All punches, fast ramp up" },
  {
    value: "pro",
    label: "PROFESSIONAL",
    desc: "Counters, feints, advanced combos",
  },
];

const ROUND_DURATIONS = [
  { value: 120, label: "2 MIN" },
  { value: 180, label: "3 MIN" },
];

const TOTAL_ROUNDS = [
  { value: 3, label: "3" },
  { value: 6, label: "6" },
  { value: 9, label: "9" },
  { value: 12, label: "12" },
];

const REST_DURATIONS = [
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
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
      <div
        className={
          options.some((o) => o.desc)
            ? "grid grid-cols-2 gap-2"
            : "flex flex-wrap gap-2"
        }
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`
                px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${options.some((o) => o.desc) ? "flex flex-col items-center justify-center text-center" : ""}
                ${
                  selected
                    ? "bg-[var(--color-accent)] text-white shadow-lg shadow-red-500/20"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/80"
                }
              `}
            >
              {opt.label}
              {opt.desc && (
                <span
                  className={`block text-[10px] font-normal mt-0.5 ${selected ? "text-white/70" : "text-[var(--color-text-muted)]"}`}
                >
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
  const [difficulty, setDifficulty] = useState<Difficulty>(
    saved?.difficulty ?? "beginner",
  );
  const [roundDuration, setRoundDuration] = useState(
    saved?.roundDuration ?? 120,
  );
  const [totalRounds, setTotalRounds] = useState(saved?.totalRounds ?? 3);
  const [restDuration, setRestDuration] = useState(saved?.restDuration ?? 30);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(
    saved?.audioCuesEnabled !== false,
  );
  useEffect(() => {
    saveSettings({
      difficulty,
      roundDuration,
      totalRounds,
      restDuration,
      audioCuesEnabled,
    });
  }, [difficulty, roundDuration, totalRounds, restDuration, audioCuesEnabled]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMoreHint, setShowMoreHint] = useState(true);
  const hasDismissedHintRef = useRef(false);
  const canHint = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ??
      false
    );
  }, []);

  useEffect(() => {
    if (!canHint) return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    const evaluate = () => {
      if (hasDismissedHintRef.current) {
        setShowMoreHint(false);
        return;
      }
      const overflow = el.scrollHeight - el.clientHeight > 8;
      const atTop = el.scrollTop <= 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      setShowMoreHint(overflow && atTop && !atBottom);
    };

    const onScroll = () => {
      // Hide immediately on first interaction for clarity, and keep it dismissed.
      hasDismissedHintRef.current = true;
      setShowMoreHint(false);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(evaluate);
    };

    evaluate();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", evaluate);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluate);
    };
  }, [canHint]);

  const handleStart = () => {
    const tuning = loadTuning();
    const hasOverrides = Object.values(tuning).some((v) => v !== undefined);
    onStart({
      difficulty,
      roundDuration,
      totalRounds,
      restDuration,
      audioCuesEnabled,
      ...(hasOverrides ? { tuning } : {}),
    });
  };

  return (
    <div className="h-full flex flex-col px-6 py-8 max-w-md mx-auto relative">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">BOXING</h1>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-accent)]">
          COACH
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Set up your workout and hit the bag.
        </p>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto pb-10" ref={scrollRef}>
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

          <div className="mb-6">
            <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] mb-3 uppercase">
              Audio
            </div>
            <button
              type="button"
              onClick={() => setAudioCuesEnabled((v) => !v)}
              className={`
                w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center justify-between
                ${
                  audioCuesEnabled
                    ? "bg-[var(--color-accent)] text-white shadow-lg shadow-red-500/20"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                }
              `}
            >
              <span>Audio cues</span>
              <span className="text-xs font-mono opacity-90">
                {audioCuesEnabled ? "ON" : "OFF"}
              </span>
            </button>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Spoken combo callouts when clips are available. Round bells still
              play unless you mute in the workout screen.
            </p>
          </div>
        </div>

        {canHint && showMoreHint && (
          <div className="pointer-events-none absolute left-0 right-0 bottom-2">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
              <span className="animate-swipe-up-hint inline-flex items-center gap-2">
                <span>Swipe up for more</span>
                <span
                  aria-hidden
                  className="inline-flex items-center leading-none"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 14l5-5 5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 19l5-5 5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.7"
                    />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        )}
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
