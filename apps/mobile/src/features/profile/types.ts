export const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'professional', label: 'Professional' },
] as const;

export const STANCE_OPTIONS = [
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'southpaw', label: 'Southpaw' },
  { value: 'unsure', label: 'Not sure' },
] as const;

export const GOAL_OPTIONS = [
  { value: 'fundamentals', label: 'Learn fundamentals' },
  { value: 'fitness', label: 'Improve fitness' },
  { value: 'heavy_bag', label: 'Heavy-bag conditioning' },
  { value: 'competition', label: 'Prepare to compete' },
] as const;

export const EQUIPMENT_OPTIONS = [
  { value: 'shadowboxing', label: 'No equipment / Shadowboxing' },
  { value: 'heavy_bag', label: 'Heavy bag' },
  { value: 'gloves', label: 'Boxing gloves' },
  { value: 'wraps', label: 'Hand wraps' },
] as const;

export const SESSION_DURATIONS = [10, 20, 30, 45, 60] as const;

export type Experience = (typeof EXPERIENCE_OPTIONS)[number]['value'];
export type Stance = (typeof STANCE_OPTIONS)[number]['value'];
export type TrainingGoal = (typeof GOAL_OPTIONS)[number]['value'];
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number]['value'];
export type SessionDuration = (typeof SESSION_DURATIONS)[number];

export interface FighterProfile {
  displayName: string;
  photoUrl: string | null;
  experience: Experience;
  stance: Stance;
  goal: TrainingGoal;
  equipment: Equipment[];
  targetDaysPerWeek: number;
  preferredSessionMinutes: SessionDuration;
}

export const DEFAULT_FIGHTER_PROFILE: FighterProfile = {
  displayName: '',
  photoUrl: null,
  experience: 'beginner',
  stance: 'unsure',
  goal: 'fundamentals',
  equipment: ['shadowboxing'],
  targetDaysPerWeek: 3,
  preferredSessionMinutes: 20,
};

export function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
) {
  return options.find(option => option.value === value)?.label ?? value;
}
