import { useState, useMemo, useRef } from 'react';
import type { Exercise, BlockType, WorkoutExercise, WorkoutBlock, WorkoutSet, MuscleArea } from '../types';
import { getAllExercises, getAlternatives } from '../data/exercises';

// Movement area groupings for the strength block
const MOVEMENT_GROUPS: { area: MuscleArea; label: string }[] = [
  { area: 'squat', label: 'Squat' },
  { area: 'hinge', label: 'Hinge' },
  { area: 'press', label: 'Press' },
  { area: 'push', label: 'Push' },
  { area: 'pull', label: 'Pull' },
  { area: 'core', label: 'Core' },
  { area: 'conditioning', label: 'Conditioning' },
  { area: 'warmup', label: 'Warmup' },
  { area: 'full-body', label: 'Full Body' },
];

interface WorkoutBuilderProps {
  onStart: (blocks: WorkoutBlock[]) => void;
  onCancel: () => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; areas: string[]; hasSets?: boolean }[] = [
  { type: 'warmup', label: 'Warm-up', areas: ['warmup', 'core', 'full-body'] },
  { type: 'strength', label: 'Strength', areas: ['squat', 'hinge', 'press', 'push', 'pull'], hasSets: true },
  { type: 'conditioning', label: 'Conditioning', areas: ['conditioning', 'core'] },
  { type: 'cooldown', label: 'Cooldown', areas: ['warmup', 'core'] },
];

const DEFAULT_SET_COUNT = 3;

// Structure: { blockType: { setNumber: exerciseIds[] } }
// setNumber 0 = all sets (used for non-set blocks)
type SetBasedExercises = Record<BlockType, Record<number, string[]>>;

export function WorkoutBuilder({ onStart, onCancel }: WorkoutBuilderProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<SetBasedExercises>({
    warmup: { 0: [] },
    strength: { 1: [], 2: [], 3: [] },
    conditioning: { 0: [] },
    cooldown: { 0: [] },
  });
  const [currentSet, setCurrentSet] = useState(1); // For strength block
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showSwapFor, setShowSwapFor] = useState<string | null>(null);
  const dragStartIndex = useRef<number | null>(null);

  const exercises = useMemo(() => getAllExercises(), []);
  const currentBlock = BLOCK_TYPES[currentBlockIndex];
  const isLastBlock = currentBlockIndex === BLOCK_TYPES.length - 1;
  const hasSets = currentBlock.hasSets;
  const activeSetKey = hasSets ? currentSet : 0;

  const availableExercises = useMemo(() => {
    return exercises.filter(e => {
      const matchesArea = currentBlock.areas.includes(e.area);
      const matchesSearch = searchQuery === '' ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesArea && matchesSearch;
    });
  }, [exercises, currentBlock, searchQuery]);

  // Get current selections for active set
  const currentSelections = selectedExercises[currentBlock.type][activeSetKey] || [];


  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const blockData = { ...prev[currentBlock.type] };
      const setData = [...(blockData[activeSetKey] || [])];

      if (setData.includes(exerciseId)) {
        blockData[activeSetKey] = setData.filter(id => id !== exerciseId);
      } else {
        blockData[activeSetKey] = [...setData, exerciseId];
      }

      return { ...prev, [currentBlock.type]: blockData };
    });
  };

  const applyToAllSets = () => {
    if (!hasSets) return;
    setSelectedExercises(prev => {
      const currentSetData = [...(prev[currentBlock.type][currentSet] || [])];
      return {
        ...prev,
        [currentBlock.type]: {
          1: [...currentSetData],
          2: [...currentSetData],
          3: [...currentSetData],
        },
      };
    });
  };

  const swapExercise = (oldId: string, newId: string) => {
    setSelectedExercises(prev => {
      const blockData = { ...prev[currentBlock.type] };
      const setData = [...(blockData[activeSetKey] || [])];
      const index = setData.indexOf(oldId);
      if (index !== -1) {
        setData[index] = newId;
        blockData[activeSetKey] = setData;
      }
      return { ...prev, [currentBlock.type]: blockData };
    });
    setShowSwapFor(null);
  };

  // Drag and drop handlers
  const handleDragStart = (exerciseId: string, index: number) => {
    setDraggedId(exerciseId);
    dragStartIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, exerciseId: string) => {
    e.preventDefault();
    if (exerciseId !== draggedId) {
      setDragOverId(exerciseId);
    }
  };

  const handleDragEnd = () => {
    if (draggedId && dragOverId && draggedId !== dragOverId) {
      setSelectedExercises(prev => {
        const blockData = { ...prev[currentBlock.type] };
        const current = [...(blockData[activeSetKey] || [])];
        const fromIndex = current.indexOf(draggedId);
        const toIndex = current.indexOf(dragOverId);

        if (fromIndex !== -1 && toIndex !== -1) {
          current.splice(fromIndex, 1);
          current.splice(toIndex, 0, draggedId);
          blockData[activeSetKey] = current;
        }

        return { ...prev, [currentBlock.type]: blockData };
      });
    }
    setDraggedId(null);
    setDragOverId(null);
    dragStartIndex.current = null;
  };

  // Group available exercises by movement area
  const groupedExercises = useMemo(() => {
    const unselected = availableExercises.filter(e => !currentSelections.includes(e.id));
    const groups: Record<string, Exercise[]> = {};

    unselected.forEach(exercise => {
      const area = exercise.area;
      if (!groups[area]) groups[area] = [];
      groups[area].push(exercise);
    });

    const sortedAreas = MOVEMENT_GROUPS.map(g => g.area).filter(area => groups[area]?.length > 0);
    return sortedAreas.map(area => ({
      area,
      label: MOVEMENT_GROUPS.find(g => g.area === area)?.label || area,
      exercises: groups[area],
    }));
  }, [availableExercises, currentSelections]);

  const handleNext = () => {
    if (isLastBlock) {
      // Build workout blocks
      const blocks: WorkoutBlock[] = [];

      BLOCK_TYPES.forEach((bt, index) => {
        const blockData = selectedExercises[bt.type];

        if (bt.hasSets) {
          // Build sets-based block
          const sets: WorkoutSet[] = [];
          for (let setNum = 1; setNum <= DEFAULT_SET_COUNT; setNum++) {
            const setExercises = blockData[setNum] || [];
            if (setExercises.length > 0) {
              sets.push({
                id: `${bt.type}-set-${setNum}`,
                setNumber: setNum,
                exercises: setExercises.map(id => {
                  const exercise = exercises.find(e => e.id === id);
                  return {
                    exerciseId: id,
                    weight: exercise?.defaultWeight,
                    reps: exercise?.defaultReps,
                    duration: exercise?.defaultDuration,
                  } as WorkoutExercise;
                }),
              });
            }
          }

          if (sets.length > 0) {
            // Flatten sets into exercises for backward compatibility
            const flatExercises: WorkoutExercise[] = [];
            sets.forEach(set => {
              set.exercises.forEach(ex => {
                flatExercises.push({ ...ex, sets: set.setNumber });
              });
            });

            blocks.push({
              id: `${bt.type}-${index}`,
              type: bt.type,
              name: bt.label,
              exercises: flatExercises,
              sets,
            });
          }
        } else {
          // Non-set block
          const exerciseIds = blockData[0] || [];
          if (exerciseIds.length > 0) {
            blocks.push({
              id: `${bt.type}-${index}`,
              type: bt.type,
              name: bt.label,
              exercises: exerciseIds.map(id => {
                const exercise = exercises.find(e => e.id === id);
                return {
                  exerciseId: id,
                  weight: exercise?.defaultWeight,
                  reps: exercise?.defaultReps,
                  duration: exercise?.defaultDuration,
                } as WorkoutExercise;
              }),
            });
          }
        }
      });

      if (blocks.length === 0) {
        alert('Please select at least one exercise');
        return;
      }

      onStart(blocks);
    } else {
      setCurrentBlockIndex(prev => prev + 1);
      setCurrentSet(1);
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    if (currentBlockIndex === 0) {
      onCancel();
    } else {
      setCurrentBlockIndex(prev => prev - 1);
      setCurrentSet(1);
      setSearchQuery('');
    }
  };

  // Calculate total selected across all blocks
  const totalSelected = useMemo(() => {
    let count = 0;
    Object.entries(selectedExercises).forEach(([blockType, blockData]) => {
      const bt = BLOCK_TYPES.find(b => b.type === blockType);
      if (bt?.hasSets) {
        // Count unique exercises across sets
        const unique = new Set<string>();
        Object.values(blockData).forEach(ids => ids.forEach(id => unique.add(id)));
        count += unique.size;
      } else {
        count += (blockData[0] || []).length;
      }
    });
    return count;
  }, [selectedExercises]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 safe-top border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-slate-500">
            {totalSelected} exercise{totalSelected !== 1 ? 's' : ''} selected
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{currentBlock.label}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {hasSets
            ? `Select exercises for Set ${currentSet}`
            : `Select exercises for your ${currentBlock.label.toLowerCase()} block`
          }
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {BLOCK_TYPES.map((bt, i) => (
            <div
              key={bt.type}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < currentBlockIndex
                  ? 'bg-emerald-500'
                  : i === currentBlockIndex
                  ? 'bg-emerald-600'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Set Tabs (for strength block) */}
      {hasSets && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex gap-2">
            {[1, 2, 3].map(setNum => {
              const setCount = (selectedExercises[currentBlock.type][setNum] || []).length;
              return (
                <button
                  key={setNum}
                  onClick={() => setCurrentSet(setNum)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    currentSet === setNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Set {setNum}
                  {setCount > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      currentSet === setNum ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}>
                      {setCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={applyToAllSets}
            className="w-full mt-2 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Apply Set {currentSet} to all sets
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {currentSelections.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              {hasSets ? `Set ${currentSet}` : 'Selected'} ({currentSelections.length}) — drag to reorder
            </div>
            <div className="space-y-2">
              {currentSelections.map((id, index) => {
                const exercise = exercises.find(e => e.id === id);
                if (!exercise) return null;
                const alternatives = getAlternatives(id);
                return (
                  <div key={id}>
                    <DraggableExerciseCard
                      exercise={exercise}
                      isDragging={draggedId === id}
                      isDragOver={dragOverId === id}
                      onDragStart={() => handleDragStart(id, index)}
                      onDragOver={(e) => handleDragOver(e, id)}
                      onDragEnd={handleDragEnd}
                      onRemove={() => toggleExercise(id)}
                      onSwap={alternatives.length > 0 ? () => setShowSwapFor(showSwapFor === id ? null : id) : undefined}
                    />
                    {showSwapFor === id && alternatives.length > 0 && (
                      <div className="mt-2 ml-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">Swap with:</div>
                        <div className="space-y-1">
                          {alternatives.map(alt => (
                            <button
                              key={alt.id}
                              onClick={() => swapExercise(id, alt.id)}
                              className="w-full p-2 rounded-lg text-left text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition-colors"
                            >
                              {alt.name}
                              <span className="text-slate-400 ml-2 text-xs">{alt.equipment}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Group exercises by movement area */}
        {groupedExercises.map(group => (
          <div key={group.area} className="mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              {group.label}
            </div>
            <div className="space-y-2">
              {group.exercises.map(exercise => (
                <ExerciseSelectCard
                  key={exercise.id}
                  exercise={exercise}
                  selected={false}
                  onToggle={() => toggleExercise(exercise.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {groupedExercises.length === 0 && currentSelections.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No exercises found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium text-sm transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200"
          >
            {currentBlockIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium text-sm transition-colors bg-slate-600 hover:bg-slate-500 text-slate-200"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3.5 px-4 rounded-xl font-medium text-sm transition-colors bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isLastBlock ? `Start (${totalSelected})` : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Draggable card for selected exercises
function DraggableExerciseCard({
  exercise,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
  onSwap,
}: {
  exercise: Exercise;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onSwap?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDragEnd}
      className={`w-full p-3 rounded-xl border text-left transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-50 scale-95 bg-emerald-600/30 border-emerald-500'
          : isDragOver
          ? 'bg-emerald-600/40 border-emerald-400 scale-[1.02]'
          : 'bg-emerald-600/20 border-emerald-600/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <div className="text-emerald-400/60">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="font-medium text-emerald-100">{exercise.name}</div>
          <div className="text-sm text-slate-400">
            {exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1)}
            {exercise.defaultWeight && ` • ${exercise.defaultWeight} lb`}
            {exercise.defaultReps && ` • ${exercise.defaultReps} reps`}
            {exercise.defaultDuration && ` • ${exercise.defaultDuration}s`}
          </div>
        </div>

        {/* Swap button */}
        {onSwap && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwap();
            }}
            className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
            title="Swap with similar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Card for available exercises
function ExerciseSelectCard({
  exercise,
  selected,
  onToggle,
}: {
  exercise: Exercise;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
        selected
          ? 'bg-emerald-600/20 border-emerald-600/50'
          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            selected
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-slate-600'
          }`}
        >
          {selected && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${selected ? 'text-emerald-100' : 'text-slate-100'}`}>
            {exercise.name}
          </div>
          <div className="text-sm text-slate-400 truncate">
            {exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1)}
            {exercise.defaultWeight && ` • ${exercise.defaultWeight} lb`}
            {exercise.defaultReps && ` • ${exercise.defaultReps} reps`}
            {exercise.defaultDuration && ` • ${exercise.defaultDuration}s`}
          </div>
        </div>
      </div>
    </button>
  );
}
