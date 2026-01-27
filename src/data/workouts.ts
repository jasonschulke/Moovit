import type { WorkoutTemplate } from '../types';

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'full-body-strength',
    name: 'Full Body Strength',
    blocks: [
      {
        id: 'warmup',
        type: 'warmup',
        name: 'Warmup',
        exercises: [
          { exerciseId: 'jumping-jacks', duration: 60 },
          { exerciseId: 'childs-pose', duration: 30 },
          { exerciseId: 'kb-dead-bugs', reps: 12, notes: 'each side' },
          { exerciseId: 'worlds-greatest-stretch', reps: 5, notes: 'each side' },
          { exerciseId: 'hollow-body-hold', duration: 30 },
          { exerciseId: 'turkish-get-ups', reps: 2, notes: 'each side' },
          { exerciseId: 'jumps', reps: 10 },
        ],
      },
      {
        id: 'strength',
        type: 'strength',
        name: 'Strength',
        exercises: [
          // Set 1
          { exerciseId: 'goblet-squat', sets: 1, weight: 50, reps: 10 },
          { exerciseId: 'deadlift', sets: 1, weight: 75, reps: 10 },
          { exerciseId: 'overhead-press', sets: 1 },
          { exerciseId: 'pushups', sets: 1 },
          { exerciseId: 'rows', sets: 1 },
          // Set 2
          { exerciseId: 'bulgarian-split-squat', sets: 2, weight: 25, reps: 10 },
          { exerciseId: 'single-leg-hinge', sets: 2, weight: 50, reps: 10 },
          { exerciseId: 'overhead-press', sets: 2, weight: 50, reps: 8 },
          { exerciseId: 'pushups', sets: 2, reps: 'AMRAP' },
          { exerciseId: 'one-arm-kb-row', sets: 2, weight: 50, reps: 10 },
          // Set 3
          { exerciseId: 'bulgarian-split-squat', sets: 3, weight: 25, reps: 10 },
          { exerciseId: 'single-leg-hinge', sets: 3, weight: 50, reps: 10 },
          { exerciseId: 'overhead-press', sets: 3, weight: 50, reps: 8 },
          { exerciseId: 'pushups', sets: 3, reps: 'AMRAP' },
          { exerciseId: 'one-arm-kb-row', sets: 3, weight: 50, reps: 10 },
        ],
      },
      {
        id: 'conditioning',
        type: 'conditioning',
        name: 'Conditioning',
        exercises: [
          { exerciseId: 'kb-swing', weight: 50 },
          { exerciseId: 'planks', duration: 45 },
          { exerciseId: 'uppies', weight: 50, reps: 10 },
          { exerciseId: 'suitcase-carry', weight: 75 },
          { exerciseId: 'burpees', reps: 10 },
        ],
      },
      {
        id: 'cooldown',
        type: 'cooldown',
        name: 'Cooldown',
        exercises: [
          { exerciseId: 'childs-pose', duration: 60 },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): WorkoutTemplate | undefined {
  return workoutTemplates.find(t => t.id === id);
}
