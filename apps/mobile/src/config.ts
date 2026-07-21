import {
  DEFAULT_SETTINGS as CORE_DEFAULT_SETTINGS,
  type SetupSettings as CoreSetupSettings,
} from '@boxing-coach/core';

export {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  TOTAL_ROUNDS,
} from '@boxing-coach/core';

export type SetupSettings = CoreSetupSettings & {
  /** When false, visual workout instructions and coach clips are disabled. */
  comboInstructionsEnabled: boolean;
};

export const DEFAULT_SETTINGS: SetupSettings = {
  ...CORE_DEFAULT_SETTINGS,
  comboInstructionsEnabled: true,
};
