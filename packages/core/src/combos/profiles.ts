import type { Difficulty, DifficultyProfile } from '../types.js';
import { beginnerCombosA, beginnerCombosB, beginnerCombosC } from './beginner.js';
import { intermediateCombosA, intermediateCombosB, intermediateCombosC } from './intermediate.js';
import { advancedCombosA, advancedCombosB, proCombos } from './advanced.js';
import { basicMovement, advancedMovement } from './movement.js';
import { basicDefense, advancedDefense } from './defense.js';

const beginnerProfile: DifficultyProfile = {
  difficulty: 'beginner',
  comboPools: {
    initial: beginnerCombosA,
    mid: [...beginnerCombosB, ...beginnerCombosA],
    late: [...beginnerCombosC, ...beginnerCombosB],
  },
  movementPools: {
    initial: basicMovement,
    mid: [],
  },
  defensePools: {
    initial: basicDefense,
    mid: [],
  },
  interval: { base: 2800, min: 2000, tightenPerRound: 150 },
  actionMix: { movementEveryN: 5, defenseEveryN: 8, tightenAtMidpoint: false },
};

const intermediateProfile: DifficultyProfile = {
  difficulty: 'intermediate',
  comboPools: {
    initial: [...beginnerCombosA, ...intermediateCombosA],
    mid: [...intermediateCombosA, ...intermediateCombosB],
    late: [...intermediateCombosB, ...intermediateCombosC],
  },
  movementPools: {
    initial: basicMovement,
    mid: advancedMovement.filter(m => m.difficulty !== 'advanced'),
  },
  defensePools: {
    initial: basicDefense,
    mid: advancedDefense.filter(d => d.difficulty === 'intermediate'),
  },
  interval: { base: 2500, min: 1200, tightenPerRound: 200 },
  actionMix: { movementEveryN: 4, defenseEveryN: 5, tightenAtMidpoint: false },
};

const advancedProfile: DifficultyProfile = {
  difficulty: 'advanced',
  comboPools: {
    initial: [...beginnerCombosA, ...intermediateCombosA],
    mid: [...intermediateCombosB, ...intermediateCombosC],
    late: [...intermediateCombosC, ...advancedCombosA, ...advancedCombosB],
  },
  movementPools: {
    initial: basicMovement,
    mid: advancedMovement,
  },
  defensePools: {
    initial: basicDefense,
    mid: advancedDefense,
  },
  interval: { base: 2200, min: 800, tightenPerRound: 300 },
  actionMix: { movementEveryN: 3, defenseEveryN: 4, tightenAtMidpoint: true },
};

const proProfile: DifficultyProfile = {
  difficulty: 'pro',
  comboPools: {
    initial: [...beginnerCombosA, ...intermediateCombosA],
    mid: [...advancedCombosA, ...intermediateCombosC, ...intermediateCombosA],
    late: [...advancedCombosB, ...advancedCombosA, ...proCombos],
  },
  movementPools: {
    initial: advancedMovement,
    mid: advancedMovement,
  },
  defensePools: {
    initial: advancedDefense,
    mid: advancedDefense,
  },
  interval: { base: 1800, min: 500, tightenPerRound: 400 },
  actionMix: { movementEveryN: 2, defenseEveryN: 3, tightenAtMidpoint: true },
};

const profiles: Record<Difficulty, DifficultyProfile> = {
  beginner: beginnerProfile,
  intermediate: intermediateProfile,
  advanced: advancedProfile,
  pro: proProfile,
};

export function getProfile(difficulty: Difficulty): DifficultyProfile {
  return profiles[difficulty];
}
