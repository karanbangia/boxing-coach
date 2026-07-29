import type { Punch } from './types.js';

export interface PunchNumberDefinition {
  number: Punch;
  name: string;
  cue: string;
  side: 'lead' | 'rear';
}

/**
 * The canonical punch-number system used by every combo and client.
 * Lead/rear terminology keeps the mapping correct for orthodox and southpaw.
 */
export const PUNCH_NUMBER_GUIDE: readonly PunchNumberDefinition[] = [
  { number: 1, name: 'Jab', cue: 'Lead straight', side: 'lead' },
  { number: 2, name: 'Cross', cue: 'Rear straight', side: 'rear' },
  { number: 3, name: 'Lead Hook', cue: 'Lead-side hook', side: 'lead' },
  { number: 4, name: 'Rear Hook', cue: 'Rear-side hook', side: 'rear' },
  { number: 5, name: 'Lead Uppercut', cue: 'Lead-side uppercut', side: 'lead' },
  { number: 6, name: 'Rear Uppercut', cue: 'Rear-side uppercut', side: 'rear' },
];
