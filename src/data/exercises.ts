import type { Exercise } from '../types';
import { loadCustomExercises } from './storage';

export const defaultExercises: Exercise[] = [
  // Warmup exercises
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    area: 'warmup',
    equipment: 'bodyweight',
    defaultDuration: 60,
    description: 'Classic cardio warmup. Jump while spreading legs and raising arms overhead.',
  },
  {
    id: 'childs-pose',
    name: "Child's Pose",
    area: 'warmup',
    equipment: 'bodyweight',
    defaultDuration: 30,
    description: 'Kneeling stretch with arms extended forward, resting forehead on ground.',
  },
  {
    id: 'kb-dead-bugs',
    name: 'Kettlebell Dead Bugs',
    area: 'core',
    equipment: 'kettlebell',
    defaultReps: 12,
    description: 'Lie on back, hold kettlebell overhead while alternating opposite arm/leg extensions.',
  },
  {
    id: 'worlds-greatest-stretch',
    name: "World's Greatest Stretch",
    area: 'warmup',
    equipment: 'bodyweight',
    defaultReps: 5,
    description: 'Lunge with rotation. Combines hip flexor, hamstring, and thoracic mobility.',
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow Body Hold',
    area: 'core',
    equipment: 'bodyweight',
    defaultDuration: 30,
    description: 'Lie on back, arms overhead, legs extended, lower back pressed to floor.',
  },
  {
    id: 'turkish-get-ups',
    name: 'Turkish Get Ups',
    area: 'full-body',
    equipment: 'kettlebell',
    defaultReps: 2,
    defaultWeight: 35,
    description: 'Complex movement from lying to standing while holding weight overhead.',
  },
  {
    id: 'jumps',
    name: 'Jumps',
    area: 'warmup',
    equipment: 'bodyweight',
    defaultReps: 10,
    description: 'Vertical jumps to activate legs and raise heart rate.',
  },

  // Squat exercises
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    area: 'squat',
    equipment: 'dumbbell',
    defaultWeight: 50,
    defaultReps: 10,
    description: 'Hold weight at chest, squat with upright torso.',
    alternatives: ['bulgarian-split-squat', 'bodyweight-squat'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    area: 'squat',
    equipment: 'dumbbell',
    defaultWeight: 25,
    defaultReps: 10,
    description: 'Single leg squat with rear foot elevated on bench.',
    alternatives: ['goblet-squat', 'lunges'],
  },
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    area: 'squat',
    equipment: 'bodyweight',
    defaultReps: 15,
    description: 'Standard squat using only body weight.',
    alternatives: ['goblet-squat', 'bulgarian-split-squat'],
  },
  {
    id: 'lunges',
    name: 'Lunges',
    area: 'squat',
    equipment: 'bodyweight',
    defaultReps: 10,
    description: 'Step forward into lunge position, alternating legs.',
    alternatives: ['bulgarian-split-squat', 'goblet-squat'],
  },

  // Hinge exercises
  {
    id: 'deadlift',
    name: 'Deadlift',
    area: 'hinge',
    equipment: 'dumbbell',
    defaultWeight: 75,
    defaultReps: 10,
    description: 'Hip hinge movement lifting weight from floor.',
    alternatives: ['single-leg-hinge', 'kb-swing'],
  },
  {
    id: 'single-leg-hinge',
    name: 'Single Leg Hinge',
    area: 'hinge',
    equipment: 'dumbbell',
    defaultWeight: 50,
    defaultReps: 10,
    description: 'Single leg Romanian deadlift for balance and posterior chain.',
    alternatives: ['deadlift', 'kb-swing'],
  },

  // Press exercises
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    area: 'press',
    equipment: 'kettlebell',
    defaultWeight: 50,
    defaultReps: 8,
    description: 'Press weight from shoulder to overhead.',
    alternatives: ['db-shoulder-press', 'push-press'],
  },
  {
    id: 'db-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    area: 'press',
    equipment: 'dumbbell',
    defaultWeight: 30,
    defaultReps: 10,
    description: 'Seated or standing dumbbell press overhead.',
    alternatives: ['overhead-press', 'push-press'],
  },
  {
    id: 'push-press',
    name: 'Push Press',
    area: 'press',
    equipment: 'kettlebell',
    defaultWeight: 45,
    defaultReps: 8,
    description: 'Use leg drive to help press weight overhead.',
    alternatives: ['overhead-press', 'db-shoulder-press'],
  },

  // Push exercises
  {
    id: 'pushups',
    name: 'Pushups',
    area: 'push',
    equipment: 'bodyweight',
    defaultReps: 'AMRAP',
    description: 'Classic chest and tricep exercise.',
    alternatives: ['incline-pushups', 'diamond-pushups'],
  },
  {
    id: 'incline-pushups',
    name: 'Incline Pushups',
    area: 'push',
    equipment: 'bodyweight',
    defaultReps: 15,
    description: 'Pushups with hands elevated, easier variation.',
    alternatives: ['pushups', 'diamond-pushups'],
  },
  {
    id: 'diamond-pushups',
    name: 'Diamond Pushups',
    area: 'push',
    equipment: 'bodyweight',
    defaultReps: 10,
    description: 'Pushups with hands together, targets triceps.',
    alternatives: ['pushups', 'incline-pushups'],
  },

  // Pull exercises
  {
    id: 'rows',
    name: 'Rows',
    area: 'pull',
    equipment: 'kettlebell',
    defaultWeight: 50,
    defaultReps: 10,
    description: 'Bent over row pulling weight to hip.',
    alternatives: ['one-arm-kb-row', 'inverted-rows'],
  },
  {
    id: 'one-arm-kb-row',
    name: 'One-arm Kettlebell Row',
    area: 'pull',
    equipment: 'kettlebell',
    defaultWeight: 50,
    defaultReps: 10,
    description: 'Single arm row with kettlebell, one hand supported.',
    alternatives: ['rows', 'inverted-rows'],
  },
  {
    id: 'inverted-rows',
    name: 'Inverted Rows',
    area: 'pull',
    equipment: 'bodyweight',
    defaultReps: 12,
    description: 'Body rows using bar or TRX at waist height.',
    alternatives: ['rows', 'one-arm-kb-row'],
  },

  // Conditioning exercises
  {
    id: 'kb-swing',
    name: 'Kettlebell Swings',
    area: 'conditioning',
    equipment: 'kettlebell',
    defaultWeight: 50,
    defaultReps: 20,
    description: 'Explosive hip hinge swinging kettlebell to shoulder height.',
  },
  {
    id: 'planks',
    name: 'Planks',
    area: 'core',
    equipment: 'bodyweight',
    defaultDuration: 45,
    description: 'Hold body in straight line on forearms and toes.',
  },
  {
    id: 'uppies',
    name: 'Uppies',
    area: 'conditioning',
    equipment: 'kettlebell',
    defaultWeight: 50,
    defaultReps: 10,
    description: 'Clean and press kettlebell from floor in one motion.',
  },
  {
    id: 'suitcase-carry',
    name: 'Suitcase/Front Carry',
    area: 'conditioning',
    equipment: 'sandbag',
    defaultWeight: 75,
    defaultDuration: 60,
    description: 'Carry weight while walking, maintaining upright posture.',
  },
  {
    id: 'burpees',
    name: 'Burpees',
    area: 'conditioning',
    equipment: 'bodyweight',
    defaultReps: 10,
    description: 'Full body exercise: squat, jump back, pushup, jump up.',
  },
];

// Combine default and custom exercises
export function getAllExercises(): Exercise[] {
  const custom = loadCustomExercises();
  return [...defaultExercises, ...custom];
}

// Legacy export for compatibility - but returns a function call result
// Components should call getAllExercises() for fresh data
export const exercises = defaultExercises;

export function getExerciseById(id: string): Exercise | undefined {
  return getAllExercises().find(e => e.id === id);
}

export function getExercisesByArea(area: string): Exercise[] {
  return getAllExercises().filter(e => e.area === area);
}

export function getAlternatives(exerciseId: string): Exercise[] {
  const allExercises = getAllExercises();
  const exercise = allExercises.find(e => e.id === exerciseId);
  if (!exercise?.alternatives) return [];
  return exercise.alternatives
    .map(id => allExercises.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined);
}
