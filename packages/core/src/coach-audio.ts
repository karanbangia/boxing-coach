import type { Action } from './types.js';
import { isFreestyleFinisherId } from './engine/combo-engine.js';

export function getCoachPlaybackRate(
  action: Pick<Action, 'id'>,
  currentRound: number,
  totalRounds: number,
): number {
  if (isFreestyleFinisherId(action.id)) {
    return 1;
  }
  if (totalRounds <= 0) {
    return 1;
  }

  const progress = currentRound / totalRounds;
  return Math.min(1.4, 1 + 0.35 * progress);
}
