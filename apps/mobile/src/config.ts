import {
  DEFAULT_SETTINGS as CORE_DEFAULT_SETTINGS,
  type SetupSettings as CoreSetupSettings,
} from '@boxing-coach/core';
import type { TrainingMode } from './features/profile/types';

export {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  TOTAL_ROUNDS,
} from '@boxing-coach/core';

export type SetupSettings = CoreSetupSettings & {
  /** The physical context used to label and tailor the training session. */
  trainingMode: TrainingMode;
  /** When false, visual workout instructions and coach clips are disabled. */
  comboInstructionsEnabled: boolean;
};

export const TRAINING_MODES: {
  value: TrainingMode;
  label: string;
  desc: string;
}[] = [
  {
    value: 'shadowboxing',
    label: 'SHADOWBOXING',
    desc: 'No bag needed',
  },
  {
    value: 'heavy_bag',
    label: 'HEAVY BAG',
    desc: 'Bag-focused rounds',
  },
];

export const DEFAULT_SETTINGS: SetupSettings = {
  ...CORE_DEFAULT_SETTINGS,
  trainingMode: 'shadowboxing',
  difficulty: 'beginner',
  roundDuration: 120,
  totalRounds: 3,
  restDuration: 60,
  comboInstructionsEnabled: true,
};
