export type EquipmentType =
  | 'bodyweight'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'sandbag'
  | 'resistance-band'
  | 'cable'
  | 'machine';

export type MuscleArea =
  | 'squat'
  | 'hinge'
  | 'press'
  | 'push'
  | 'pull'
  | 'core'
  | 'conditioning'
  | 'warmup'
  | 'cooldown'
  | 'full-body';

export type BlockType = 'warmup' | 'strength' | 'conditioning' | 'cooldown';

export type EffortLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Exercise {
  id: string;
  name: string;
  area: MuscleArea;
  equipment: EquipmentType;
  defaultWeight?: number;
  defaultReps?: number | 'AMRAP';
  defaultDuration?: number; // seconds
  imageUrl?: string;
  description?: string;
  alternatives?: string[]; // IDs of alternative exercises
}

export interface WorkoutExercise {
  exerciseId: string;
  weight?: number;
  reps?: number | 'AMRAP';
  duration?: number; // seconds
  sets?: number;
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  name: string;
  exercises: WorkoutExercise[]; // Flat list for backward compatibility
  sets?: WorkoutSet[]; // Optional set-based structure
  repeat?: number; // number of times to repeat the block (for sets)
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  blocks: WorkoutBlock[];
}

export interface SavedWorkout {
  id: string;
  name: string;
  estimatedMinutes?: number;
  blocks: WorkoutBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseLog {
  exerciseId: string;
  weight?: number;
  reps?: number;
  duration?: number;
  effort?: EffortLevel;
  notes?: string;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  blocks: WorkoutBlock[];
  startedAt: string;
  completedAt?: string;
  exercises: ExerciseLog[];
  totalDuration?: number;
  overallEffort?: EffortLevel;
}

export interface WorkoutState {
  currentSession: WorkoutSession | null;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isTimerActive: boolean;
  timerSeconds: number;
}

export const EFFORT_DESCRIPTIONS: Record<EffortLevel, { label: string; description: string }> = {
  1: { label: 'Very Light', description: 'Barely any effort, could do this all day' },
  2: { label: 'Light', description: 'Easy breathing, very comfortable' },
  3: { label: 'Light-Moderate', description: 'Comfortable, could hold a conversation' },
  4: { label: 'Moderate', description: 'Breathing heavier, still comfortable' },
  5: { label: 'Moderate', description: 'Starting to sweat, can still talk' },
  6: { label: 'Moderate-Hard', description: 'Challenging but sustainable' },
  7: { label: 'Hard', description: 'Difficult to talk, breathing hard' },
  8: { label: 'Very Hard', description: 'Very challenging, short sentences only' },
  9: { label: 'Extremely Hard', description: 'Almost all-out, can barely continue' },
  10: { label: 'Maximum', description: 'All-out effort, cannot maintain' }
};
