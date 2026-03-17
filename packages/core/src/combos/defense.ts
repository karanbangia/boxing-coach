import type { Action } from '../types.js';

export const basicDefense: Action[] = [
  { id: 'd-hands-up', type: 'defense', label: 'HANDS UP', description: 'Tighten your guard', difficulty: 'beginner', durationMs: 800 },
  { id: 'd-block', type: 'defense', label: 'BLOCK', description: 'High block', difficulty: 'beginner', durationMs: 800 },
  { id: 'd-guard', type: 'defense', label: 'GUARD UP', description: 'Keep that guard tight', difficulty: 'beginner', durationMs: 800 },
  { id: 'd-peek', type: 'defense', label: 'PEEK-A-BOO', description: 'Tight guard, eyes on target', difficulty: 'beginner', durationMs: 1000 },
];

export const advancedDefense: Action[] = [
  { id: 'd-slip', type: 'defense', label: 'SLIP', description: 'Slip to the side', difficulty: 'intermediate', durationMs: 800 },
  { id: 'd-roll', type: 'defense', label: 'ROLL', description: 'Roll under', difficulty: 'intermediate', durationMs: 1000 },
  { id: 'd-slip-left', type: 'defense', label: 'SLIP LEFT', description: 'Slip to the left', difficulty: 'intermediate', durationMs: 800 },
  { id: 'd-slip-right', type: 'defense', label: 'SLIP RIGHT', description: 'Slip to the right', difficulty: 'intermediate', durationMs: 800 },
  { id: 'd-pull-back', type: 'defense', label: 'PULL BACK', description: 'Pull back and counter', difficulty: 'intermediate', durationMs: 1200 },
  { id: 'd-parry', type: 'defense', label: 'PARRY', description: 'Parry and counter', difficulty: 'advanced', durationMs: 1200 },
  { id: 'd-slip-slip', type: 'defense', label: 'SLIP-SLIP', description: 'Double slip', difficulty: 'advanced', durationMs: 1200 },
  { id: 'd-catch-return', type: 'defense', label: 'CATCH AND RETURN', description: 'Catch the shot, fire back', difficulty: 'advanced', durationMs: 1400 },
  { id: 'd-shoulder-roll', type: 'defense', label: 'SHOULDER ROLL', description: 'Shoulder roll defense', difficulty: 'advanced', durationMs: 1200 },
  { id: 'd-duck', type: 'defense', label: 'DUCK', description: 'Duck under the shot', difficulty: 'advanced', durationMs: 800 },
];
