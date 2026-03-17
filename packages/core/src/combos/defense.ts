import type { Action } from '../types.js';

export const basicDefense: Action[] = [
  { id: 'd-hands-up', type: 'defense', label: 'HANDS UP', description: 'Tighten your guard', difficulty: 'beginner' },
  { id: 'd-block', type: 'defense', label: 'BLOCK', description: 'High block', difficulty: 'beginner' },
  { id: 'd-guard', type: 'defense', label: 'GUARD UP', description: 'Keep that guard tight', difficulty: 'beginner' },
  { id: 'd-peek', type: 'defense', label: 'PEEK-A-BOO', description: 'Tight guard, eyes on target', difficulty: 'beginner' },
];

export const advancedDefense: Action[] = [
  { id: 'd-slip', type: 'defense', label: 'SLIP', description: 'Slip to the side', difficulty: 'intermediate' },
  { id: 'd-roll', type: 'defense', label: 'ROLL', description: 'Roll under', difficulty: 'intermediate' },
  { id: 'd-slip-left', type: 'defense', label: 'SLIP LEFT', description: 'Slip to the left', difficulty: 'intermediate' },
  { id: 'd-slip-right', type: 'defense', label: 'SLIP RIGHT', description: 'Slip to the right', difficulty: 'intermediate' },
  { id: 'd-pull-back', type: 'defense', label: 'PULL BACK', description: 'Pull back and counter', difficulty: 'intermediate' },
  { id: 'd-parry', type: 'defense', label: 'PARRY', description: 'Parry and counter', difficulty: 'advanced' },
  { id: 'd-slip-slip', type: 'defense', label: 'SLIP-SLIP', description: 'Double slip', difficulty: 'advanced' },
  { id: 'd-catch-return', type: 'defense', label: 'CATCH AND RETURN', description: 'Catch the shot, fire back', difficulty: 'advanced' },
  { id: 'd-shoulder-roll', type: 'defense', label: 'SHOULDER ROLL', description: 'Shoulder roll defense', difficulty: 'advanced' },
  { id: 'd-duck', type: 'defense', label: 'DUCK', description: 'Duck under the shot', difficulty: 'advanced' },
];
