import type { TuningOverrides } from '@boxing-coach/core';

interface Props {
  tuning: TuningOverrides;
  onChange: (tuning: TuningOverrides) => void;
}

interface SliderRowProps {
  label: string;
  hint: string;
  value: number | undefined;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number | undefined) => void;
}

function SliderRow({ label, hint, value, defaultValue, min, max, step, unit = '', onChange }: SliderRowProps) {
  const active = value !== undefined;
  const display = value ?? defaultValue;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={() => onChange(active ? undefined : defaultValue)}
          className={`text-sm font-bold tracking-wide ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
        >
          {label} {active ? '' : '(default)'}
        </button>
        <span className="text-sm font-mono text-white">
          {display}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={display}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-[var(--color-surface-2)] accent-[var(--color-accent)]"
      />
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</div>
    </div>
  );
}

export function TuningPanel({ tuning, onChange }: Props) {
  const set = (key: keyof TuningOverrides) => (v: number | undefined) => {
    onChange({ ...tuning, [key]: v });
  };

  return (
    <div>
      <SliderRow
        label="Recovery Gap Base"
        hint="ms recovery after action at round 1 (added to action duration)"
        value={tuning.intervalBase}
        defaultValue={1300}
        min={500}
        max={6000}
        step={250}
        unit="ms"
        onChange={set('intervalBase')}
      />
      <SliderRow
        label="Recovery Gap Min"
        hint="fastest recovery pace (floor)"
        value={tuning.intervalMin}
        defaultValue={800}
        min={300}
        max={4000}
        step={250}
        unit="ms"
        onChange={set('intervalMin')}
      />
      <SliderRow
        label="Tighten / Round"
        hint="ms subtracted each round"
        value={tuning.tightenPerRound}
        defaultValue={250}
        min={0}
        max={1000}
        step={25}
        unit="ms"
        onChange={set('tightenPerRound')}
      />
      <SliderRow
        label="Movement Every N"
        hint="movement command every Nth action"
        value={tuning.movementEveryN}
        defaultValue={4}
        min={2}
        max={10}
        step={1}
        onChange={set('movementEveryN')}
      />
      <SliderRow
        label="Defense Every N"
        hint="defense command every Nth action"
        value={tuning.defenseEveryN}
        defaultValue={5}
        min={2}
        max={15}
        step={1}
        onChange={set('defenseEveryN')}
      />
      <SliderRow
        label="Freestyle Threshold"
        hint="seconds before round end to start freestyle"
        value={tuning.freestyleThreshold}
        defaultValue={12}
        min={0}
        max={60}
        step={1}
        unit="s"
        onChange={set('freestyleThreshold')}
      />
      <SliderRow
        label="Freestyle Interval"
        hint="ms between actions during freestyle"
        value={tuning.freestyleIntervalMs}
        defaultValue={1200}
        min={400}
        max={3000}
        step={100}
        unit="ms"
        onChange={set('freestyleIntervalMs')}
      />
      <SliderRow
        label="Jitter"
        hint="random +/- variation on interval"
        value={tuning.jitterMs}
        defaultValue={200}
        min={0}
        max={2000}
        step={50}
        unit="ms"
        onChange={set('jitterMs')}
      />

      <button
        onClick={() => onChange({})}
        className="mt-2 text-sm font-bold text-[var(--color-text-muted)] tracking-wider hover:text-white transition-colors"
      >
        RESET ALL TO DEFAULTS
      </button>
    </div>
  );
}
