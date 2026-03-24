import type { Action } from '../types.js';

export const basicMovement: Action[] = [
  { id: 'm-move', type: 'movement', label: 'MOVE MOVE', description: 'Lateral movement', difficulty: 'beginner', durationMs: 1200 },
  { id: 'm-touch', type: 'movement', label: 'TOUCH AND MOVE', description: 'Light jab then reposition', difficulty: 'beginner', durationMs: 1200 },
  { id: 'm-step-back', type: 'movement', label: 'STEP BACK', description: 'Step back and reset', difficulty: 'beginner', durationMs: 800 },
  { id: 'm-bounce', type: 'movement', label: 'BOUNCE', description: 'Stay light on your feet', difficulty: 'beginner', durationMs: 1200 },
  { id: 'm-reset', type: 'movement', label: 'RESET', description: 'Reset your stance', difficulty: 'beginner', durationMs: 800 },
];

export const advancedMovement: Action[] = [
  { id: 'm-circle-l', type: 'movement', label: 'CIRCLE LEFT', description: 'Circle to the left', difficulty: 'intermediate', durationMs: 1200 },
  { id: 'm-circle-r', type: 'movement', label: 'CIRCLE RIGHT', description: 'Circle to the right', difficulty: 'intermediate', durationMs: 1200 },
  { id: 'm-lateral', type: 'movement', label: 'LATERAL STEP', description: 'Quick lateral step', difficulty: 'intermediate', durationMs: 800 },
  { id: 'm-level-change', type: 'movement', label: 'LEVEL CHANGE', description: 'Drop levels and come back', difficulty: 'intermediate', durationMs: 1200 },
  { id: 'm-in-out', type: 'movement', label: 'IN AND OUT', description: 'Step in, throw, step out', difficulty: 'advanced', durationMs: 1600 },
  { id: 'm-pivot', type: 'movement', label: 'PIVOT', description: 'Pivot off center line', difficulty: 'advanced', durationMs: 1200 },
  { id: 'm-angle', type: 'movement', label: 'CUT THE ANGLE', description: 'Step to an angle', difficulty: 'advanced', durationMs: 1200 },
  { id: 'm-switch', type: 'movement', label: 'SWITCH STANCE', description: 'Quick stance switch', difficulty: 'advanced', durationMs: 800 },
  { id: 'm-feint-move', type: 'movement', label: 'FEINT AND MOVE', description: 'Feint then reposition', difficulty: 'advanced', durationMs: 1200 },
];
