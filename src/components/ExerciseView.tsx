import { useState, useEffect } from 'react';
import type { WorkoutExercise } from '../types';
import { getExerciseById, getAlternatives } from '../data/exercises';
import { getLastWeekAverages, getExerciseHistory, getDefaultWeightForEquipment } from '../data/storage';
import { fetchExerciseGif } from '../utils/exerciseGifs';
import { Timer } from './Timer';
import { Sparkline } from './Sparkline';

interface ExerciseViewProps {
  workoutExercise: WorkoutExercise;
  onComplete: (log: {
    exerciseId: string;
    weight?: number;
    reps?: number;
    duration?: number;
  }) => void;
  onSkip: () => void;
  onSwapExercise: (newExerciseId: string) => void;
}

export function ExerciseView({
  workoutExercise,
  onComplete,
  onSkip,
  onSwapExercise,
}: ExerciseViewProps) {
  const exercise = getExerciseById(workoutExercise.exerciseId);
  const lastWeekAvg = exercise ? getLastWeekAverages(exercise.id) : null;

  // Weight priority: explicit workout value > last week avg > equipment default > exercise default
  const getInitialWeight = (): number | undefined => {
    if (workoutExercise.weight) return workoutExercise.weight;
    if (lastWeekAvg?.avgWeight && lastWeekAvg.avgWeight > 0) return lastWeekAvg.avgWeight;
    if (exercise) return getDefaultWeightForEquipment(exercise.equipment) ?? exercise.defaultWeight;
    return undefined;
  };

  // Reps priority: explicit workout value > last week avg > exercise default
  const getInitialReps = (): number | string | undefined => {
    if (workoutExercise.reps) return workoutExercise.reps;
    if (lastWeekAvg?.avgReps && lastWeekAvg.avgReps > 0) return lastWeekAvg.avgReps;
    return exercise?.defaultReps;
  };

  const [weight, setWeight] = useState<number | undefined>(getInitialWeight);
  const [reps, setReps] = useState<number | string | undefined>(getInitialReps);
  const [showHistory, setShowHistory] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(true);

  // Fetch exercise GIF
  useEffect(() => {
    if (exercise) {
      setGifLoading(true);
      fetchExerciseGif(exercise.name).then(url => {
        setGifUrl(url);
        setGifLoading(false);
      });
    }
  }, [exercise?.name]);

  if (!exercise) {
    return <div className="p-4 text-red-400">Exercise not found</div>;
  }

  const alternatives = getAlternatives(exercise.id);
  const history = getExerciseHistory(exercise.id, 10);
  const duration = workoutExercise.duration ?? exercise.defaultDuration;

  const handleComplete = () => {
    onComplete({
      exerciseId: exercise.id,
      weight,
      reps: typeof reps === 'number' ? reps : undefined,
      duration,
    });
  };

  const equipmentLabel = exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1);
  const areaLabel = exercise.area.charAt(0).toUpperCase() + exercise.area.slice(1);

  return (
    <div className="flex flex-col">
      {/* Main Content */}
      <div className="px-5 py-6">
        {/* Hero: Exercise Name */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{exercise.name}</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {areaLabel} · {equipmentLabel}
          </div>
        </div>

        {/* Exercise GIF */}
        {gifUrl && !gifLoading && (
          <div className="flex justify-center mb-4">
            <img
              src={gifUrl}
              alt={`${exercise.name} demonstration`}
              className="w-32 h-32 object-contain rounded-lg bg-slate-100 dark:bg-slate-800"
              loading="lazy"
            />
          </div>
        )}

        {/* History with Sparklines */}
        {history.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              {/* Weight trend */}
              {exercise.equipment !== 'bodyweight' && history.some(h => h.weight) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Weight</span>
                  <Sparkline history={history} metric="weight" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {history[0].weight}lb
                  </span>
                </div>
              )}
              {/* Reps trend */}
              {history.some(h => h.reps) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Reps</span>
                  <Sparkline history={history} metric="reps" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {history[0].reps}
                  </span>
                </div>
              )}
            </div>
            {/* Toggle detailed history */}
            <div className="text-center mt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
              >
                {showHistory ? 'hide details' : `show ${history.length} sessions`}
              </button>
            </div>
          </div>
        )}

        {/* Detailed History - Collapsible */}
        {showHistory && history.length > 0 && (
          <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
            {history.map((log, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                <span className="text-slate-500">
                  {new Date(log.completedAt).toLocaleDateString()}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {log.weight && `${log.weight}lb`} {log.reps && `× ${log.reps}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timer - Collapsible */}
        {showTimer && (
          <div className="mb-6">
            <Timer autoStart={true} />
          </div>
        )}

        {/* Weight & Reps Input - Compact */}
        {!duration && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {exercise.equipment !== 'bodyweight' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Weight</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight || ''}
                    onChange={e => setWeight(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-semibold text-center focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                    placeholder="—"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">lb</span>
                </div>
              </div>
            )}
            <div className={exercise.equipment === 'bodyweight' ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Reps</label>
              <input
                type={reps === 'AMRAP' ? 'text' : 'number'}
                value={reps === 'AMRAP' ? 'AMRAP' : reps || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val.toUpperCase() === 'AMRAP') {
                    setReps('AMRAP');
                  } else {
                    setReps(val ? Number(val) : undefined);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-semibold text-center focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                placeholder="—"
              />
            </div>
          </div>
        )}

        {/* Description/Instructions - Above swap */}
        {exercise.description && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">How to</div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {exercise.description}
            </p>
          </div>
        )}

        {/* Swap - Simple text links */}
        {alternatives.length > 0 && (
          <div className="text-center">
            <span className="text-sm text-slate-400 dark:text-slate-500">Swap: </span>
            {alternatives.map((alt, idx) => (
              <span key={alt.id}>
                <button
                  onClick={() => onSwapExercise(alt.id)}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
                >
                  {alt.name}
                </button>
                {idx < alternatives.length - 1 && <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-3">
          <button
            onClick={() => setShowTimer(!showTimer)}
            className={`py-3.5 px-4 rounded-xl transition-colors ${
              showTimer
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400'
            }`}
            title="Timer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-base transition-colors bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          >
            Skip
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-base transition-colors bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
