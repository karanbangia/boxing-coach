import type { Action } from '../types.js';

export const beginnerCombosA: Action[] = [
  { id: 'b-1', type: 'combo', label: '1', description: 'Jab', difficulty: 'beginner' },
  { id: 'b-2', type: 'combo', label: '2', description: 'Cross', difficulty: 'beginner' },
  { id: 'b-1-1', type: 'combo', label: '1-1', description: 'Jab - Jab', difficulty: 'beginner' },
  { id: 'b-1-2', type: 'combo', label: '1-2', description: 'Jab - Cross', difficulty: 'beginner' },
  { id: 'b-2-1', type: 'combo', label: '2-1', description: 'Cross - Jab', difficulty: 'beginner' },
  { id: 'b-2-2', type: 'combo', label: '2-2', description: 'Cross - Cross', difficulty: 'beginner' },
  { id: 'b-1-1-1', type: 'combo', label: '1-1-1', description: 'Triple Jab', difficulty: 'beginner' },
];

export const beginnerCombosB: Action[] = [
  { id: 'b-1-1-2', type: 'combo', label: '1-1-2', description: 'Jab - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-1-2-1', type: 'combo', label: '1-2-1', description: 'Jab - Cross - Jab', difficulty: 'beginner' },
  { id: 'b-2-1-2', type: 'combo', label: '2-1-2', description: 'Cross - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-1-1-1-2', type: 'combo', label: '1-1-1-2', description: 'Jab - Jab - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-2-2-1', type: 'combo', label: '2-2-1', description: 'Cross - Cross - Jab', difficulty: 'beginner' },
  { id: 'b-1-2-2', type: 'combo', label: '1-2-2', description: 'Jab - Cross - Cross', difficulty: 'beginner' },
  { id: 'b-2-1-1', type: 'combo', label: '2-1-1', description: 'Cross - Jab - Jab', difficulty: 'beginner' },
];

export const beginnerCombosC: Action[] = [
  { id: 'b-1-2-1-2', type: 'combo', label: '1-2-1-2', description: 'Jab - Cross - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-2-1-1-2', type: 'combo', label: '2-1-1-2', description: 'Cross - Jab - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-1-2-1-1', type: 'combo', label: '1-2-1-1', description: 'Jab - Cross - Jab - Jab', difficulty: 'beginner' },
  { id: 'b-1-1-2-1', type: 'combo', label: '1-1-2-1', description: 'Jab - Jab - Cross - Jab', difficulty: 'beginner' },
  { id: 'b-1-2-2-1', type: 'combo', label: '1-2-2-1', description: 'Jab - Cross - Cross - Jab', difficulty: 'beginner' },
  { id: 'b-2-1-2-1', type: 'combo', label: '2-1-2-1', description: 'Cross - Jab - Cross - Jab', difficulty: 'beginner' },
  { id: 'b-1-1-2-1-2', type: 'combo', label: '1-1-2-1-2', description: 'Jab - Jab - Cross - Jab - Cross', difficulty: 'beginner' },
  { id: 'b-1-2-1-2-1', type: 'combo', label: '1-2-1-2-1', description: 'Jab - Cross - Jab - Cross - Jab', difficulty: 'beginner' },
];
