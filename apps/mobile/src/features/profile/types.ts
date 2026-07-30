export const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Just starting', description: 'New or returning' },
  { value: 'intermediate', label: 'Building momentum', description: '1–2 workouts/week' },
  { value: 'advanced', label: 'In the groove', description: '3–4 workouts/week' },
  { value: 'professional', label: 'All in', description: '5+ workouts/week' },
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

export const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Not set' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'KG' },
  { value: 'lb', label: 'LB' },
] as const;

export const HEIGHT_UNIT_OPTIONS = [
  { value: 'cm', label: 'CM' },
  { value: 'in', label: 'FT + IN' },
] as const;

export const TRAINING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type Experience = (typeof EXPERIENCE_OPTIONS)[number]['value'];
export type Stance = (typeof STANCE_OPTIONS)[number]['value'];
export type TrainingGoal = (typeof GOAL_OPTIONS)[number]['value'];
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number]['value'];
export type TrainingMode = Extract<Equipment, 'shadowboxing' | 'heavy_bag'>;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];
export type TrainingDay = (typeof TRAINING_DAYS)[number];
export type GenderIdentity = 'unspecified' | 'male' | 'female';
export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'in';

export interface FighterProfile {
  displayName: string;
  photoUrl: string | null;
  gender: GenderIdentity;
  experience: Experience;
  stance: Stance;
  goal: TrainingGoal;
  equipment: Equipment[];
  trainingDays: TrainingDay[];
  targetDaysPerWeek: number;
  preferredSessionMinutes: SessionDuration;
  weightKg: number | null;
  weightUnit: WeightUnit;
  heightCm: number | null;
  heightUnit: HeightUnit;
}

export const DEFAULT_FIGHTER_PROFILE: FighterProfile = {
  displayName: '',
  photoUrl: null,
  gender: 'unspecified',
  experience: 'beginner',
  stance: 'unsure',
  goal: 'fundamentals',
  equipment: ['shadowboxing'],
  trainingDays: ['monday', 'wednesday', 'friday'],
  targetDaysPerWeek: 3,
  preferredSessionMinutes: 20,
  weightKg: null,
  weightUnit: 'kg',
  heightCm: null,
  heightUnit: 'cm',
};

export function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
) {
  return options.find(option => option.value === value)?.label ?? value;
}

export function trainingModeFromEquipment(
  equipment: readonly Equipment[],
): TrainingMode {
  return equipment.includes('heavy_bag') ? 'heavy_bag' : 'shadowboxing';
}

export function equipmentForTrainingMode(
  trainingMode: TrainingMode,
  equipment: readonly Equipment[],
): Equipment[] {
  const accessories = equipment.filter(
    item => item !== 'shadowboxing' && item !== 'heavy_bag',
  );
  return [trainingMode, ...accessories];
}
