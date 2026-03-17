import type { Action } from '../types.js';

export const basicMovement: Action[] = [
  { id: 'm-move', type: 'movement', label: 'MOVE MOVE', description: 'Lateral movement', difficulty: 'beginner' },
  { id: 'm-touch', type: 'movement', label: 'TOUCH AND MOVE', description: 'Light jab then reposition', difficulty: 'beginner' },
  { id: 'm-step-back', type: 'movement', label: 'STEP BACK', description: 'Step back and reset', difficulty: 'beginner' },
  { id: 'm-bounce', type: 'movement', label: 'BOUNCE', description: 'Stay light on your feet', difficulty: 'beginner' },
  { id: 'm-reset', type: 'movement', label: 'RESET', description: 'Reset your stance', difficulty: 'beginner' },
  { id: 'm-jab-move', type: 'movement', label: 'JAB AND MOVE', description: 'Jab then step away', difficulty: 'beginner' },
];

export const advancedMovement: Action[] = [
  { id: 'm-circle-l', type: 'movement', label: 'CIRCLE LEFT', description: 'Circle to the left', difficulty: 'intermediate' },
  { id: 'm-circle-r', type: 'movement', label: 'CIRCLE RIGHT', description: 'Circle to the right', difficulty: 'intermediate' },
  { id: 'm-lateral', type: 'movement', label: 'LATERAL STEP', description: 'Quick lateral step', difficulty: 'intermediate' },
  { id: 'm-level-change', type: 'movement', label: 'LEVEL CHANGE', description: 'Drop levels and come back', difficulty: 'intermediate' },
  { id: 'm-in-out', type: 'movement', label: 'IN AND OUT', description: 'Step in, throw, step out', difficulty: 'advanced' },
  { id: 'm-pivot', type: 'movement', label: 'PIVOT', description: 'Pivot off center line', difficulty: 'advanced' },
  { id: 'm-angle', type: 'movement', label: 'CUT THE ANGLE', description: 'Step to an angle', difficulty: 'advanced' },
  { id: 'm-switch', type: 'movement', label: 'SWITCH STANCE', description: 'Quick stance switch', difficulty: 'advanced' },
  { id: 'm-feint-move', type: 'movement', label: 'FEINT AND MOVE', description: 'Feint then reposition', difficulty: 'advanced' },
];
