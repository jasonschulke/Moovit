import { useState, useMemo } from 'react';
import type { SavedWorkout, WorkoutBlock, Exercise, MuscleArea } from '../types';
import { loadSavedWorkouts, deleteSavedWorkout, addSavedWorkout, updateSavedWorkout, loadCustomExercises, deleteCustomExercise, getLastWeekAverages } from '../data/storage';
import { getAllExercises } from '../data/exercises';
import { Button } from '../components/Button';
import { WorkoutBuilder } from '../components/WorkoutBuilder';

interface LibraryPageProps {
  onStartWorkout: (blocks: WorkoutBlock[]) => void;
}

type TabType = 'workouts' | 'exercises';

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

export function LibraryPage({ onStartWorkout }: LibraryPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('workouts');

  // Workouts state
  const [workouts, setWorkouts] = useState(() => loadSavedWorkouts());
  const [editingWorkout, setEditingWorkout] = useState<SavedWorkout | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState<WorkoutBlock[] | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Exercises state
  const [filter, setFilter] = useState<MuscleArea | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [customExercises, setCustomExercises] = useState(() => loadCustomExercises());
  const [showExerciseDeleteConfirm, setShowExerciseDeleteConfirm] = useState<string | null>(null);

  const exercises = useMemo(() => getAllExercises(), [customExercises]);

  const refreshWorkouts = () => {
    setWorkouts(loadSavedWorkouts());
  };

  const refreshCustomExercises = () => {
    setCustomExercises(loadCustomExercises());
  };

  const getExerciseCount = (blocks: WorkoutBlock[]) => {
    return blocks.reduce((acc, b) => acc + b.exercises.length, 0);
  };

  const getBlockSummary = (blocks: WorkoutBlock[]) => {
    return blocks.map(b => `${b.name} (${b.exercises.length})`).join(', ');
  };

  const handleCreateNew = () => {
    setShowBuilder(true);
  };

  const handleBuilderComplete = (blocks: WorkoutBlock[]) => {
    setShowBuilder(false);
    setSavingBlocks(blocks);
    setWorkoutName('');
    setEstimatedMinutes('');
  };

  const handleSaveWorkout = () => {
    if (!savingBlocks || !workoutName.trim()) return;

    if (editingWorkout) {
      updateSavedWorkout(editingWorkout.id, {
        name: workoutName.trim(),
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        blocks: savingBlocks,
      });
    } else {
      addSavedWorkout({
        name: workoutName.trim(),
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        blocks: savingBlocks,
      });
    }

    refreshWorkouts();
    setSavingBlocks(null);
    setEditingWorkout(null);
    setWorkoutName('');
    setEstimatedMinutes('');
  };

  const handleEditWorkout = (workout: SavedWorkout) => {
    setEditingWorkout(workout);
    setWorkoutName(workout.name);
    setEstimatedMinutes(workout.estimatedMinutes?.toString() || '');
    setSavingBlocks(workout.blocks);
  };

  const handleDeleteWorkout = (id: string) => {
    deleteSavedWorkout(id);
    refreshWorkouts();
    setShowDeleteConfirm(null);
  };

  const handleDeleteExercise = (id: string) => {
    deleteCustomExercise(id);
    refreshCustomExercises();
    setShowExerciseDeleteConfirm(null);
  };

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

  // Workout builder flow
  if (showBuilder) {
    return (
      <WorkoutBuilder
        onStart={handleBuilderComplete}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  // Save workout form
  if (savingBlocks) {
    return (
      <div className="min-h-screen flex flex-col px-4 pt-14 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
        <header className="mb-6">
          <button
            onClick={() => {
              setSavingBlocks(null);
              setEditingWorkout(null);
            }}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {editingWorkout ? 'Edit Workout' : 'Save Workout'}
          </h1>
        </header>

        <div className="space-y-6 flex-1">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preview</div>
            <div className="text-slate-800 dark:text-slate-200">
              {getExerciseCount(savingBlocks)} exercises in {savingBlocks.length} blocks
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {getBlockSummary(savingBlocks)}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Workout Name</label>
            <input
              type="text"
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              placeholder="e.g., Full Body Strength"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              Estimated Time (minutes, optional)
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={e => setEstimatedMinutes(e.target.value)}
              placeholder="e.g., 45"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowBuilder(true)}
            className="w-full p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Edit exercises
          </button>
        </div>

        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveWorkout}
            disabled={!workoutName.trim()}
            className="w-full"
          >
            {editingWorkout ? 'Save Changes' : 'Save to Library'}
          </Button>
        </div>
      </div>
    );
  }

  // Exercise detail view
  if (selectedExercise) {
    const averages = getLastWeekAverages(selectedExercise.id);
    const isCustom = selectedExercise.id.startsWith('custom-');

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
          {isCustom && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 text-xs">
              Custom
            </span>
          )}
        </header>

        <div className="px-4 space-y-6">
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-sm">
              {selectedExercise.area}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">
              {selectedExercise.equipment}
            </span>
          </div>

          {selectedExercise.description && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</h3>
              <p className="text-slate-700 dark:text-slate-200">{selectedExercise.description}</p>
            </div>
          )}

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

          {isCustom && (
            <div className="pt-4">
              {showExerciseDeleteConfirm === selectedExercise.id ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                  <p className="text-red-800 dark:text-red-200 mb-4 text-center">
                    Delete "{selectedExercise.name}"?
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowExerciseDeleteConfirm(null)} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleDeleteExercise(selectedExercise.id);
                        setSelectedExercise(null);
                      }}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowExerciseDeleteConfirm(selectedExercise.id)}
                  className="w-full text-red-500 hover:text-red-600"
                >
                  Delete Custom Exercise
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
      <header className="px-4 pt-14 pb-4 safe-top">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Library</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Workouts & exercises</p>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Workouts ({workouts.length})
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'exercises'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Exercises ({exercises.length})
          </button>
        </div>
      </div>

      {/* Workouts Tab */}
      {activeTab === 'workouts' && (
        <div className="px-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateNew}
            className="w-full mb-6"
          >
            Create New Workout
          </Button>

          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-slate-500 dark:text-slate-400">No saved workouts yet</div>
              <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Create a workout and save it to your library
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map(workout => (
                <div
                  key={workout.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none"
                >
                  {showDeleteConfirm === workout.id ? (
                    <div className="text-center">
                      <p className="text-slate-800 dark:text-slate-200 mb-4">Delete "{workout.name}"?</p>
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{workout.name}</div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                              {getExerciseCount(workout.blocks)} exercises
                            </span>
                            {workout.estimatedMinutes && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                ~{workout.estimatedMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onStartWorkout(workout.blocks)}
                          className="flex-1"
                        >
                          Start
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditWorkout(workout)}
                        >
                          Edit
                        </Button>
                        <button
                          onClick={() => setShowDeleteConfirm(workout.id)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div>
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
          <div className="px-4 mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
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
      )}
    </div>
  );
}

function ExerciseCard({ exercise, onClick }: { exercise: Exercise; onClick: () => void }) {
  const isCustom = exercise.id.startsWith('custom-');
  const equipmentLabel = exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1).replace('-', ' ');

  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 dark:text-slate-100">{exercise.name}</span>
            {isCustom && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium">
                Custom
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
              {equipmentLabel}
            </span>
            {exercise.defaultWeight && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                {exercise.defaultWeight} lb
              </span>
            )}
            {exercise.defaultReps && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                {exercise.defaultReps} reps
              </span>
            )}
            {exercise.defaultDuration && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                {exercise.defaultDuration}s
              </span>
            )}
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
