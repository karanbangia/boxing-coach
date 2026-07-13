import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  type EngineConfig,
  type SetupSettings,
} from "@boxing-coach/core";
import { loadTuning } from "../lib/storage";

export type StartWorkoutPayload = EngineConfig & { audioCuesEnabled: boolean };

const STORAGE_KEY = "boxing-coach-settings";

type SavedSettings = Omit<SetupSettings, "audioCuesEnabled"> & {
  /** When false, coach MP3s are not played during the workout. */
  audioCuesEnabled?: boolean;
};

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

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 12;

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  variant = "grid",
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
  variant?: "grid" | "inline";
}) {
  const hasDescriptions = options.some((o) => o.desc);

  return (
    <section className="flex flex-col gap-2">
      <div className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.1em] text-[var(--color-peach)]">
        {label}
      </div>
      <div
        className={
          variant === "grid"
            ? "grid grid-cols-2 gap-1"
            : `grid ${options.length >= 4 ? "grid-cols-4" : "grid-cols-2"} gap-2`
        }
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={[
                "min-w-0 border-2 border-solid bg-[var(--color-surface)] transition-colors active:scale-[0.98]",
                selected
                  ? "border-[var(--color-accent)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-peach)]",
                hasDescriptions
                  ? "flex min-h-[96px] flex-col items-start justify-center gap-2 px-4 py-4 text-left"
                  : "flex min-h-14 items-center justify-center px-2 py-3 text-center",
                variant === "inline" && selected ? "bg-[var(--color-accent)]" : "",
              ].join(" ")}
            >
              <span
                className={
                  hasDescriptions
                    ? "font-['Anton'] text-2xl font-normal uppercase leading-none tracking-[0.02em]"
                    : "font-['Anton'] text-2xl font-normal uppercase leading-none"
                }
              >
                {opt.label}
              </span>
              {opt.desc && (
                <span className="font-['Archivo_Narrow'] text-base leading-5 text-[var(--color-text-muted)]">
                  {opt.desc}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SetupScreen({ onStart }: Props) {
  const saved = loadSettings();
  const [difficulty, setDifficulty] = useState(
    saved?.difficulty ?? DEFAULT_SETTINGS.difficulty,
  );
  const [roundDuration, setRoundDuration] = useState(
    saved?.roundDuration ?? DEFAULT_SETTINGS.roundDuration,
  );
  const [totalRounds, setTotalRounds] = useState(
    saved?.totalRounds ?? DEFAULT_SETTINGS.totalRounds,
  );
  const [restDuration, setRestDuration] = useState(
    saved?.restDuration ?? DEFAULT_SETTINGS.restDuration,
  );
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(
    saved?.audioCuesEnabled ?? DEFAULT_SETTINGS.audioCuesEnabled,
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
    <div className="mx-auto flex h-full max-w-[420px] flex-col bg-[var(--color-bg)] px-5 pt-6">
      <div className="pb-10">
        <h1 className="font-['Anton'] text-[64px] font-normal uppercase leading-none text-[var(--color-peach)]">
          SETUP YOUR
        </h1>
        <h2 className="font-['Anton'] text-[64px] font-normal uppercase leading-none text-[var(--color-accent)]">
          WORKOUT
        </h2>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="flex h-full flex-col gap-6 overflow-y-auto pb-10" ref={scrollRef}>
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
            variant="inline"
          />

          <section className="flex flex-col gap-2">
            <div className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.1em] text-[var(--color-peach)]">
              Rounds
            </div>
            <div className="flex min-h-[88px] items-center justify-between border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5">
              <button
                type="button"
                onClick={() => setTotalRounds((rounds) => Math.max(MIN_ROUNDS, rounds - 1))}
                className="flex h-11 w-11 items-center justify-center font-['Space_Grotesk'] text-4xl leading-none text-[var(--color-peach)] transition-colors hover:text-white disabled:opacity-35"
                disabled={totalRounds <= MIN_ROUNDS}
                aria-label="Decrease rounds"
              >
                -
              </button>
              <div className="font-['Anton'] text-[64px] leading-none text-white">
                {totalRounds}
              </div>
              <button
                type="button"
                onClick={() => setTotalRounds((rounds) => Math.min(MAX_ROUNDS, rounds + 1))}
                className="flex h-11 w-11 items-center justify-center font-['Space_Grotesk'] text-4xl leading-none text-[var(--color-peach)] transition-colors hover:text-white disabled:opacity-35"
                disabled={totalRounds >= MAX_ROUNDS}
                aria-label="Increase rounds"
              >
                +
              </button>
            </div>
          </section>

          <OptionGroup
            label="Rest Period"
            options={REST_DURATIONS}
            value={restDuration}
            onChange={setRestDuration}
            variant="inline"
          />

          <section className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setAudioCuesEnabled((v) => !v)}
              className="flex min-h-[52px] w-full items-center justify-between border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-left transition-colors hover:border-[var(--color-peach)]"
              aria-pressed={audioCuesEnabled}
            >
              <span className="flex min-w-0 items-center gap-3">
                <svg className="shrink-0 text-[var(--color-accent)]" width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
                  <path d="M4 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M0 18c0-3 1.8-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6.5c1.6 1.6 1.6 4.4 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 3c3.5 3.6 3.5 9.4 0 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-['Space_Grotesk'] text-sm font-bold uppercase leading-4 tracking-[0.1em] text-[var(--color-peach)]">
                    Audio Cues
                  </span>
                  <span className="font-['Archivo_Narrow'] text-sm leading-4 text-[var(--color-text-muted)]">
                    Coach instructions
                  </span>
                </span>
              </span>
              <span
                className={[
                  "relative h-6 w-12 shrink-0 rounded-full transition-colors",
                  audioCuesEnabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-[left]",
                    audioCuesEnabled ? "left-7" : "left-1",
                  ].join(" ")}
                />
              </span>
            </button>
          </section>

          <button
            onClick={handleStart}
            className="mt-8 flex min-h-[74px] w-full items-center justify-center gap-3 bg-[var(--color-accent)] px-5 font-['Anton'] text-3xl font-normal uppercase leading-none text-white transition-transform active:scale-[0.98]"
          >
            <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden>
              <path d="M0 0v14l11-7L0 0Z" fill="currentColor" />
            </svg>
            START WORKOUT
          </button>
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
    </div>
  );
}
