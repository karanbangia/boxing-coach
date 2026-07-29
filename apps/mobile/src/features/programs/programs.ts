import type { TuningOverrides } from '@boxing-coach/core';
import type { SetupSettings } from '../../config';

export type ProgramId =
  | 'beginner-fundamentals'
  | 'heavy-bag-conditioning'
  | 'fight-camp';

export interface ProgramSession {
  id: string;
  programId: ProgramId;
  week: number;
  sessionInWeek: number;
  sequence: number;
  title: string;
  focus: string;
  settings: Pick<
    SetupSettings,
    'difficulty' | 'roundDuration' | 'totalRounds' | 'restDuration' | 'trainingMode'
  >;
  tuning: TuningOverrides;
}

export interface BoxingProgram {
  id: ProgramId;
  title: string;
  kicker: string;
  summary: string;
  audience: string;
  weeks: number;
  sessionsPerWeek: number;
  accent: readonly [string, string, string];
  outcomes: readonly string[];
  sessions: ProgramSession[];
}

interface SessionTemplate {
  title: string;
  focus: string;
  movementEveryN: number;
  defenseEveryN: number;
  intervalOffsetMs: number;
}

function buildSessions({
  programId,
  weeks,
  sessionsPerWeek,
  templates,
  settingsForWeek,
}: {
  programId: ProgramId;
  weeks: number;
  sessionsPerWeek: number;
  templates: readonly SessionTemplate[];
  settingsForWeek: (week: number, sessionInWeek: number) => ProgramSession['settings'];
}) {
  return Array.from({ length: weeks * sessionsPerWeek }, (_, index): ProgramSession => {
    const week = Math.floor(index / sessionsPerWeek) + 1;
    const sessionInWeek = (index % sessionsPerWeek) + 1;
    const template = templates[(sessionInWeek - 1) % templates.length];
    const settings = settingsForWeek(week, sessionInWeek);
    const baseInterval = {
      beginner: 2800,
      intermediate: 2500,
      advanced: 2200,
      pro: 1800,
    }[settings.difficulty];

    return {
      id: `${programId}-w${week}-s${sessionInWeek}`,
      programId,
      week,
      sessionInWeek,
      sequence: index + 1,
      title: template.title,
      focus: template.focus,
      settings,
      tuning: {
        intervalBase: Math.max(1300, baseInterval + template.intervalOffsetMs - (week - 1) * 80),
        movementEveryN: template.movementEveryN,
        defenseEveryN: template.defenseEveryN,
        tightenAtMidpoint: week > 1,
      },
    };
  });
}

const beginnerFundamentals: BoxingProgram = {
  id: 'beginner-fundamentals',
  title: 'BEGINNER FUNDAMENTALS',
  kicker: '2-WEEK FOUNDATION',
  summary: 'Build repeatable rhythm with basic combinations, movement, and defensive calls.',
  audience: 'New and returning boxers',
  weeks: 2,
  sessionsPerWeek: 3,
  accent: ['#ff4b3e', '#b90f16', '#4c070b'],
  outcomes: [
    'Finish six structured sessions',
    'Progress from steady to medium pace',
    'Hear movement and defense in every week',
  ],
  sessions: buildSessions({
    programId: 'beginner-fundamentals',
    weeks: 2,
    sessionsPerWeek: 3,
    templates: [
      {
        title: 'STEADY COMBINATIONS',
        focus: 'Basic punch calls at a controlled pace',
        movementEveryN: 6,
        defenseEveryN: 9,
        intervalOffsetMs: 250,
      },
      {
        title: 'MOVE & RESET',
        focus: 'More frequent movement between combinations',
        movementEveryN: 3,
        defenseEveryN: 8,
        intervalOffsetMs: 150,
      },
      {
        title: 'DEFENSE RHYTHM',
        focus: 'Regular defensive calls under steady work',
        movementEveryN: 5,
        defenseEveryN: 4,
        intervalOffsetMs: 100,
      },
    ],
    settingsForWeek: week => ({
      difficulty: week === 1 ? 'beginner' : 'intermediate',
      trainingMode: 'shadowboxing',
      totalRounds: week === 1 ? 3 : 4,
      roundDuration: 120,
      restDuration: 60,
    }),
  }),
};

const heavyBagConditioning: BoxingProgram = {
  id: 'heavy-bag-conditioning',
  title: 'HEAVY BAG CONDITIONING',
  kicker: '4-WEEK BUILD',
  summary: 'Progress volume, round length, and callout pace without pretending to measure power.',
  audience: 'Bag users building work capacity',
  weeks: 4,
  sessionsPerWeek: 3,
  accent: ['#ff342c', '#a30c13', '#2f0508'],
  outcomes: [
    'Progress from four to seven rounds',
    'Build from two-minute to three-minute work',
    'Keep defense and movement in bag sessions',
  ],
  sessions: buildSessions({
    programId: 'heavy-bag-conditioning',
    weeks: 4,
    sessionsPerWeek: 3,
    templates: [
      {
        title: 'VOLUME ROUNDS',
        focus: 'Consistent combination volume',
        movementEveryN: 6,
        defenseEveryN: 8,
        intervalOffsetMs: -100,
      },
      {
        title: 'DEFENSE UNDER WORK',
        focus: 'Defensive calls woven into bag combinations',
        movementEveryN: 5,
        defenseEveryN: 3,
        intervalOffsetMs: 0,
      },
      {
        title: 'PRESSURE PACE',
        focus: 'Shorter recovery between coaching calls',
        movementEveryN: 4,
        defenseEveryN: 5,
        intervalOffsetMs: -350,
      },
    ],
    settingsForWeek: week => ({
      difficulty: week < 3 ? 'intermediate' : 'advanced',
      trainingMode: 'heavy_bag',
      totalRounds: 3 + week,
      roundDuration: week < 3 ? 120 : 180,
      restDuration: week === 1 ? 60 : 30,
    }),
  }),
};

const fightCamp: BoxingProgram = {
  id: 'fight-camp',
  title: 'FIGHT CAMP',
  kicker: '6-WEEK PEAK',
  summary: 'A demanding progression of longer rounds, faster calls, movement, and defense.',
  audience: 'Experienced boxers with a training base',
  weeks: 6,
  sessionsPerWeek: 4,
  accent: ['#ef211b', '#8e080f', '#250306'],
  outcomes: [
    'Complete 24 progressive sessions',
    'Build from six to ten three-minute rounds',
    'Reach Pro pace in the final three weeks',
  ],
  sessions: buildSessions({
    programId: 'fight-camp',
    weeks: 6,
    sessionsPerWeek: 4,
    templates: [
      {
        title: 'TECHNICAL ROUNDS',
        focus: 'Controlled pace with complete combination pools',
        movementEveryN: 4,
        defenseEveryN: 5,
        intervalOffsetMs: 150,
      },
      {
        title: 'DEFENSE & MOVEMENT',
        focus: 'Frequent movement and defensive calls',
        movementEveryN: 2,
        defenseEveryN: 3,
        intervalOffsetMs: 50,
      },
      {
        title: 'CHAMPIONSHIP PACE',
        focus: 'Aggressive callout cadence across full rounds',
        movementEveryN: 3,
        defenseEveryN: 4,
        intervalOffsetMs: -300,
      },
      {
        title: 'LONG ROUNDS',
        focus: 'Sustained three-minute work with tightening pace',
        movementEveryN: 3,
        defenseEveryN: 3,
        intervalOffsetMs: -150,
      },
    ],
    settingsForWeek: week => ({
      difficulty: week <= 3 ? 'advanced' : 'pro',
      trainingMode: 'heavy_bag',
      totalRounds: Math.min(10, 5 + week),
      roundDuration: 180,
      restDuration: week <= 2 ? 60 : 30,
    }),
  }),
};

export const BOXING_PROGRAMS: readonly BoxingProgram[] = [
  beginnerFundamentals,
  heavyBagConditioning,
  fightCamp,
];

export function getProgram(programId: ProgramId) {
  return BOXING_PROGRAMS.find(program => program.id === programId) ?? null;
}
