import { useMemo } from 'react';
import type { WorkoutBlock, SavedWorkout } from '../types';
import { getLastWorkout, loadSavedWorkouts } from '../data/storage';
import { getExerciseById } from '../data/exercises';

interface WorkoutStartFlowProps {
  onStartLastWorkout: (blocks: WorkoutBlock[]) => void;
  onCreateNew: () => void;
  onStartSavedWorkout: (workout: SavedWorkout) => void;
  onManageLibrary: () => void;
}

export function WorkoutStartFlow({
  onStartLastWorkout,
  onCreateNew,
  onStartSavedWorkout,
  onManageLibrary,
}: WorkoutStartFlowProps) {
  const lastWorkout = useMemo(() => getLastWorkout(), []);
  const savedWorkouts = useMemo(() => loadSavedWorkouts(), []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getExerciseCount = (blocks: WorkoutBlock[]) => {
    return blocks.reduce((acc, b) => acc + b.exercises.length, 0);
  };

  const getExerciseNames = (blocks: WorkoutBlock[], limit = 3) => {
    const names: string[] = [];
    for (const block of blocks) {
      for (const ex of block.exercises) {
        const exercise = getExerciseById(ex.exerciseId);
        if (exercise && names.length < limit) {
          names.push(exercise.name);
        }
      }
    }
    return names;
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-16 pb-24 safe-top">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Start Workout</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Choose how to begin</p>
      </header>

      <div className="space-y-4">
        {/* Last Workout */}
        {lastWorkout && (
          <button
            onClick={() => onStartLastWorkout(lastWorkout.blocks)}
            className="w-full p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 dark:from-emerald-600/20 dark:to-emerald-600/5 border border-emerald-500/30 dark:border-emerald-600/30 text-left hover:from-emerald-500/30 dark:hover:from-emerald-600/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                  Repeat Last Workout
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {getExerciseCount(lastWorkout.blocks)} exercises
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {getExerciseNames(lastWorkout.blocks).join(', ')}
                  {getExerciseCount(lastWorkout.blocks) > 3 && '...'}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {formatTimeAgo(lastWorkout.completedAt)}
                </div>
              </div>
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </button>
        )}

        {/* Create New */}
        <button
          onClick={onCreateNew}
          className="w-full p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New Workout</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pick exercises for each block
              </div>
            </div>
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>

        {/* Saved Workouts Section */}
        {savedWorkouts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">My Workouts</h2>
              <button
                onClick={onManageLibrary}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
              >
                Manage
              </button>
            </div>
            <div className="space-y-3">
              {savedWorkouts.slice(0, 5).map(workout => (
                <button
                  key={workout.id}
                  onClick={() => onStartSavedWorkout(workout)}
                  className="w-full p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{workout.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {getExerciseCount(workout.blocks)} exercises
                        {workout.estimatedMinutes && ` • ~${workout.estimatedMinutes} min`}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
