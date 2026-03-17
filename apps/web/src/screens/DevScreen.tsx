import { useEffect, useState } from 'react';
import type { TuningOverrides } from '@boxing-coach/core';
import { TuningPanel } from '../components/TuningPanel';
import { loadTuning, saveTuning } from '../lib/storage';

export function DevScreen() {
  const [tuning, setTuning] = useState<TuningOverrides>(loadTuning);

  useEffect(() => {
    saveTuning(tuning);
  }, [tuning]);

  return (
    <div className="h-full flex flex-col px-6 py-8 max-w-md mx-auto">
      <div className="mb-6">
        <a
          href="#/"
          className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] hover:text-white transition-colors"
        >
          &larr; BACK
        </a>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">DEV</h1>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-accent)]">TUNING</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Tweak engine parameters. Changes apply on next workout start.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <TuningPanel tuning={tuning} onChange={setTuning} />
      </div>
    </div>
  );
}
