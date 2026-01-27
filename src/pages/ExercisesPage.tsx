import { useState, useMemo } from 'react';
import type { Exercise, MuscleArea } from '../types';
import { getAllExercises } from '../data/exercises';
import { getLastWeekAverages } from '../data/storage';

const AREA_FILTERS: { value: MuscleArea | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'squat', label: 'Squat' },
  { value: 'hinge', label: 'Hinge' },
  { value: 'press', label: 'Press' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'core', label: 'Core' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'full-body', label: 'Full Body' },
];

export function ExercisesPage() {
  const [filter, setFilter] = useState<MuscleArea | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const exercises = useMemo(() => getAllExercises(), []);

  const filteredExercises = useMemo(() => {
    return exercises.filter(e => {
      const matchesArea = filter === 'all' || e.area === filter;
      const matchesSearch = search === '' ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.equipment.toLowerCase().includes(search.toLowerCase());
      return matchesArea && matchesSearch;
    });
  }, [exercises, filter, search]);

  const groupedByArea = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    filteredExercises.forEach(e => {
      if (!groups[e.area]) groups[e.area] = [];
      groups[e.area].push(e);
    });
    return groups;
  }, [filteredExercises]);

  if (selectedExercise) {
    const averages = getLastWeekAverages(selectedExercise.id);

    return (
      <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
        <header className="px-4 pt-14 pb-4 safe-top">
          <button
            onClick={() => setSelectedExercise(null)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedExercise.name}</h1>
        </header>

        <div className="px-4 space-y-6">
          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-sm">
              {selectedExercise.area}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">
              {selectedExercise.equipment}
            </span>
          </div>

          {/* Description */}
          {selectedExercise.description && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</h3>
              <p className="text-slate-700 dark:text-slate-200">{selectedExercise.description}</p>
            </div>
          )}

          {/* Defaults */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Defaults</h3>
            <div className="grid grid-cols-2 gap-4">
              {selectedExercise.defaultWeight && (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedExercise.defaultWeight} lb
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Weight</div>
                </div>
              )}
              {selectedExercise.defaultReps && (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedExercise.defaultReps}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Reps</div>
                </div>
              )}
              {selectedExercise.defaultDuration && (
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedExercise.defaultDuration}s
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Duration</div>
                </div>
              )}
            </div>
          </div>

          {/* Last Week Averages */}
          {averages && (averages.avgWeight > 0 || averages.avgReps > 0) && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-200 dark:border-emerald-600/20">
              <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3">Last Week Averages</h3>
              <div className="grid grid-cols-2 gap-4">
                {averages.avgWeight > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{averages.avgWeight} lb</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Avg Weight</div>
                  </div>
                )}
                {averages.avgReps > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{averages.avgReps}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Avg Reps</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {selectedExercise.alternatives && selectedExercise.alternatives.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Alternatives</h3>
              <div className="space-y-2">
                {selectedExercise.alternatives.map(altId => {
                  const alt = exercises.find(e => e.id === altId);
                  if (!alt) return null;
                  return (
                    <button
                      key={altId}
                      onClick={() => setSelectedExercise(alt)}
                      className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-left hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-200">{alt.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{alt.equipment}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
      <header className="px-4 pt-14 pb-4 safe-top">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Exercises</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{exercises.length} exercises</p>
      </header>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {AREA_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 space-y-6">
        {filter === 'all' ? (
          Object.entries(groupedByArea).map(([area, areaExercises]) => (
            <div key={area}>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {area}
              </h3>
              <div className="space-y-2">
                {areaExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => setSelectedExercise(exercise)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => setSelectedExercise(exercise)}
              />
            ))}
          </div>
        )}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No exercises found
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, onClick }: { exercise: Exercise; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{exercise.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {exercise.equipment}
            {exercise.defaultWeight && ` • ${exercise.defaultWeight}lb`}
            {exercise.defaultReps && ` • ${exercise.defaultReps} reps`}
            {exercise.defaultDuration && ` • ${exercise.defaultDuration}s`}
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
