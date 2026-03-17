import type { Difficulty, DifficultyProfile } from '../types.js';
import { beginnerCombosA, beginnerCombosB, beginnerCombosC } from './beginner.js';
import { intermediateCombosA, intermediateCombosB } from './intermediate.js';
import { advancedCombosA, advancedCombosB, proCombos } from './advanced.js';
import { basicMovement, advancedMovement } from './movement.js';
import { basicDefense, advancedDefense } from './defense.js';

const beginnerProfile: DifficultyProfile = {
  difficulty: 'beginner',
  comboPools: {
    initial: beginnerCombosA,
    mid: beginnerCombosB,
    late: beginnerCombosC,
  },
  movementPools: {
    initial: basicMovement,
    mid: [],
  },
  defensePools: {
    initial: basicDefense,
    mid: [],
  },
  interval: { base: 6000, min: 4500, tightenPerRound: 150 },
  actionMix: { movementEveryN: 5, defenseEveryN: 8, tightenAtMidpoint: false },
};

const intermediateProfile: DifficultyProfile = {
  difficulty: 'intermediate',
  comboPools: {
    initial: [...beginnerCombosA, ...beginnerCombosB],
    mid: intermediateCombosA,
    late: intermediateCombosB,
  },
  movementPools: {
    initial: basicMovement,
    mid: advancedMovement.filter(m => m.difficulty !== 'advanced'),
  },
  defensePools: {
    initial: basicDefense,
    mid: advancedDefense.filter(d => d.difficulty === 'intermediate'),
  },
  interval: { base: 5500, min: 3000, tightenPerRound: 250 },
  actionMix: { movementEveryN: 4, defenseEveryN: 5, tightenAtMidpoint: false },
};

const advancedProfile: DifficultyProfile = {
  difficulty: 'advanced',
  comboPools: {
    initial: [...beginnerCombosA, ...beginnerCombosB],
    mid: [...intermediateCombosA, ...advancedCombosA],
    late: [...intermediateCombosB, ...advancedCombosB],
  },
  movementPools: {
    initial: basicMovement,
    mid: advancedMovement,
  },
  defensePools: {
    initial: basicDefense,
    mid: advancedDefense,
  },
  interval: { base: 5000, min: 2000, tightenPerRound: 400 },
  actionMix: { movementEveryN: 3, defenseEveryN: 4, tightenAtMidpoint: true },
};

const proProfile: DifficultyProfile = {
  difficulty: 'pro',
  comboPools: {
    initial: [...advancedCombosA, ...advancedCombosB],
    mid: [...intermediateCombosA, ...advancedCombosB],
    late: proCombos,
  },
  movementPools: {
    initial: advancedMovement,
    mid: advancedMovement,
  },
  defensePools: {
    initial: advancedDefense,
    mid: advancedDefense,
  },
  interval: { base: 4500, min: 1800, tightenPerRound: 500 },
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
