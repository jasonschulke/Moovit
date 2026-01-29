import { useMemo } from 'react';
import type { WorkoutBlock, SavedWorkout, CardioType } from '../types';
import { CARDIO_TYPE_LABELS, CARDIO_TYPE_ICONS } from '../types';
import { getLastWorkout, loadSavedWorkouts } from '../data/storage';

interface WorkoutStartFlowProps {
  onStartLastWorkout: (blocks: WorkoutBlock[]) => void;
  onCreateNew: () => void;
  onStartSavedWorkout: (workout: SavedWorkout) => void;
  onStartCardio: (type: CardioType) => void;
  onManageLibrary: () => void;
}

export function WorkoutStartFlow({
  onStartLastWorkout,
  onCreateNew,
  onStartSavedWorkout,
  onStartCardio,
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

  return (
    <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 pt-16 pb-6 safe-top">
        <div className="flex items-center gap-2">
          <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
          <img src="/workout.svg" alt="Workout" className="h-5 dark:invert" />
        </div>
      </header>

      {/* Hero Start Button */}
      <div className="px-4 mb-6">
        <button
          onClick={onCreateNew}
          className="w-full py-6 transition-all active:scale-[0.98]"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New Workout</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pick exercises for each block</div>
            </div>
          </div>
        </button>
      </div>

      {/* Timed Cardio */}
      <div className="px-4 mb-8">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Timed Cardio</h2>
        <div className="grid grid-cols-4 gap-2">
          {(['walk', 'run', 'trail-run', 'hike'] as CardioType[]).map((type) => (
            <button
              key={type}
              onClick={() => onStartCardio(type)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-[0.97]"
            >
              <span className="text-2xl">{CARDIO_TYPE_ICONS[type]}</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{CARDIO_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 space-y-6">
        {/* Repeat Last */}
        {lastWorkout && (
          <div>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Quick Start</h2>
            <button
              onClick={() => onStartLastWorkout(lastWorkout.blocks)}
              className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100">Repeat Last Workout</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {getExerciseCount(lastWorkout.blocks)} exercises • {formatTimeAgo(lastWorkout.completedAt)}
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Saved Workouts */}
        {savedWorkouts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Saved Workouts</h2>
              <button
                onClick={onManageLibrary}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2">
              {savedWorkouts.slice(0, 5).map(workout => (
                <button
                  key={workout.id}
                  onClick={() => onStartSavedWorkout(workout)}
                  className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{workout.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {getExerciseCount(workout.blocks)} exercises
                        {workout.estimatedMinutes && ` • ~${workout.estimatedMinutes} min`}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no workouts saved */}
        {savedWorkouts.length === 0 && !lastWorkout && (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">
              Create your first workout to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
