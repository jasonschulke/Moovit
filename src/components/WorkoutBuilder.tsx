import { useState, useMemo, useRef } from 'react';
import type { BlockType, WorkoutExercise, WorkoutBlock, MuscleArea, EquipmentType } from '../types';
import { getAllExercises, getExerciseById } from '../data/exercises';
import { addCustomExercise } from '../data/storage';
import { useSignUpPrompt } from '../contexts/SignUpPromptContext';
import { Button } from './Button';

interface WorkoutBuilderProps {
  onStart: (blocks: WorkoutBlock[]) => void;
  onCancel: () => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; areas: MuscleArea[] }[] = [
  { type: 'warmup', label: 'Warm-up', areas: ['warmup', 'core', 'full-body'] },
  { type: 'strength', label: 'Strength', areas: ['squat', 'hinge', 'press', 'push', 'pull'] },
  { type: 'conditioning', label: 'Conditioning', areas: ['conditioning', 'core'] },
  { type: 'cooldown', label: 'Cooldown', areas: ['warmup', 'core', 'cooldown'] },
];

const DEFAULT_SET_COUNT = 3;

// Block type icons
const getBlockIcon = (type: BlockType) => {
  switch (type) {
    case 'warmup':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      );
    case 'strength':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h2l2-3v6l-2-3H3zm18 0h-2l-2-3v6l2-3h2zm-9-4a2 2 0 100 4 2 2 0 000-4zm-4 2h2m4 0h2" />
        </svg>
      );
    case 'conditioning':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'cooldown':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
};

// Movement area colors
const getAreaColor = (area: string) => {
  switch (area) {
    case 'squat':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'hinge':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    case 'press':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'push':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
    case 'pull':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'core':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300';
    case 'conditioning':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'warmup':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
    case 'cooldown':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  }
};

export function WorkoutBuilder({ onStart, onCancel }: WorkoutBuilderProps) {
  const { triggerSignUpPrompt } = useSignUpPrompt();

  // Store exercises per block: { blockType: { setNum: exerciseId[] } }
  const [blockExercises, setBlockExercises] = useState<Record<BlockType, Record<number, string[]>>>({
    warmup: { 1: [] },
    strength: { 1: [], 2: [], 3: [] },
    conditioning: { 1: [] },
    cooldown: { 1: [] },
  });

  // Adding exercise state
  const [addingToBlock, setAddingToBlock] = useState<BlockType | null>(null);
  const [addingToSet, setAddingToSet] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');


  // Swipe to delete state - use refs for smooth animation during swipe
  const [swipingExercise, setSwipingExercise] = useState<{ blockType: BlockType; setNum: number; exerciseIdx: number } | null>(null);
  const swipeStartX = useRef(0);
  const swipeOffsetRef = useRef(0);
  const swipeElementRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 80;

  // Create exercise modal state
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [createForBlock, setCreateForBlock] = useState<BlockType | null>(null);
  const [createForSet, setCreateForSet] = useState<number | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseArea, setNewExerciseArea] = useState<MuscleArea>('core');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<EquipmentType>('bodyweight');
  const [newExerciseReps, setNewExerciseReps] = useState<string>('');
  const [newExerciseDuration, setNewExerciseDuration] = useState<string>('');
  const [exerciseListKey, setExerciseListKey] = useState(0);

  const exercises = useMemo(() => getAllExercises(), [exerciseListKey]);

  // Swipe handlers - use direct DOM manipulation for smooth 60fps animation
  const handleTouchStart = (e: React.TouchEvent, blockType: BlockType, setNum: number, exerciseIdx: number, element: HTMLDivElement | null) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeOffsetRef.current = 0;
    swipeElementRef.current = element;
    setSwipingExercise({ blockType, setNum, exerciseIdx });
    if (element) {
      element.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingExercise || !swipeElementRef.current) return;
    const diff = swipeStartX.current - e.touches[0].clientX;
    const offset = Math.max(0, Math.min(diff, 120));
    swipeOffsetRef.current = offset;
    // Direct DOM update - no React re-render
    swipeElementRef.current.style.transform = `translateX(-${offset}px)`;
  };

  const handleTouchEnd = () => {
    if (!swipingExercise) return;
    const element = swipeElementRef.current;
    if (element) {
      element.style.transition = 'transform 0.2s ease-out';
      if (swipeOffsetRef.current >= swipeThreshold) {
        // Slide out completely before removing
        element.style.transform = 'translateX(-100%)';
        setTimeout(() => {
          removeExercise(swipingExercise.blockType, swipingExercise.setNum, swipingExercise.exerciseIdx);
        }, 150);
      } else {
        // Snap back
        element.style.transform = 'translateX(0)';
      }
    }
    setSwipingExercise(null);
    swipeOffsetRef.current = 0;
    swipeElementRef.current = null;
  };

  // Move exercise up or down in the list
  const moveExercise = (blockType: BlockType, setNum: number, fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    setBlockExercises(prev => {
      const newData = { ...prev };
      const setExercises = [...(newData[blockType][setNum] || [])];
      if (toIdx < 0 || toIdx >= setExercises.length) return prev;
      const [removed] = setExercises.splice(fromIdx, 1);
      setExercises.splice(toIdx, 0, removed);
      newData[blockType] = { ...newData[blockType], [setNum]: setExercises };
      return newData;
    });
  };

  const removeExercise = (blockType: BlockType, setNum: number, exerciseIdx: number) => {
    setBlockExercises(prev => {
      const newData = { ...prev };
      const setExercises = [...(newData[blockType][setNum] || [])];
      setExercises.splice(exerciseIdx, 1);
      newData[blockType] = { ...newData[blockType], [setNum]: setExercises };
      return newData;
    });
  };

  const addExercise = (blockType: BlockType, setNum: number, exerciseId: string) => {
    setBlockExercises(prev => {
      const newData = { ...prev };
      const setExercises = [...(newData[blockType][setNum] || [])];
      setExercises.push(exerciseId);
      newData[blockType] = { ...newData[blockType], [setNum]: setExercises };
      return newData;
    });
    // Keep menu open for quick multi-select, just clear search
    setExerciseSearch('');
  };

  const copyToNextSet = (blockType: BlockType, currentSetNum: number, exerciseId: string) => {
    const nextSetNum = currentSetNum + 1;
    if (nextSetNum > DEFAULT_SET_COUNT) return;
    setBlockExercises(prev => {
      const newData = { ...prev };
      const nextSetExercises = [...(newData[blockType][nextSetNum] || [])];
      if (!nextSetExercises.includes(exerciseId)) {
        nextSetExercises.push(exerciseId);
        newData[blockType] = { ...newData[blockType], [nextSetNum]: nextSetExercises };
      }
      return newData;
    });
  };

  // Open create exercise modal
  const openCreateExercise = (blockType: BlockType, setNum: number) => {
    const blockConfig = BLOCK_TYPES.find(b => b.type === blockType);
    setCreateForBlock(blockType);
    setCreateForSet(setNum);
    setNewExerciseName('');
    setNewExerciseArea(blockConfig?.areas[0] || 'core');
    setNewExerciseEquipment('bodyweight');
    setNewExerciseReps('');
    setNewExerciseDuration('');
    setShowCreateExercise(true);
  };

  // Handle creating a new exercise
  const handleCreateExercise = () => {
    if (!newExerciseName.trim() || !createForBlock || createForSet === null) return;

    const newExercise = addCustomExercise({
      name: newExerciseName.trim(),
      area: newExerciseArea,
      equipment: newExerciseEquipment,
      defaultReps: newExerciseReps ? parseInt(newExerciseReps) : undefined,
      defaultDuration: newExerciseDuration ? parseInt(newExerciseDuration) : undefined,
    });

    // Refresh the exercise list
    setExerciseListKey(k => k + 1);

    // Add the new exercise to the current block/set
    addExercise(createForBlock, createForSet, newExercise.id);

    // Close the modal
    setShowCreateExercise(false);
    setCreateForBlock(null);
    setCreateForSet(null);

    // Prompt anonymous users to sign up after creating a custom exercise
    triggerSignUpPrompt('exercise');
  };

  // Get filtered exercises for adding
  const getFilteredExercises = (blockType: BlockType, setNum: number) => {
    const blockConfig = BLOCK_TYPES.find(b => b.type === blockType);
    if (!blockConfig) return [];
    const existingIds = new Set(blockExercises[blockType][setNum] || []);
    return exercises.filter(e => {
      if (existingIds.has(e.id)) return false;
      if (!blockConfig.areas.includes(e.area)) return false;
      if (!exerciseSearch) return true;
      return e.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    }).slice(0, 10);
  };

  // Get exercise count for a block
  const getBlockExerciseCount = (blockType: BlockType) => {
    const blockData = blockExercises[blockType];
    const unique = new Set<string>();
    Object.values(blockData).forEach(ids => ids.forEach(id => unique.add(id)));
    return unique.size;
  };

  // Get total exercise count
  const totalExercises = useMemo(() => {
    let count = 0;
    Object.values(blockExercises).forEach(blockData => {
      const unique = new Set<string>();
      Object.values(blockData).forEach(ids => ids.forEach(id => unique.add(id)));
      count += unique.size;
    });
    return count;
  }, [blockExercises]);

  // Build workout blocks and start
  const handleStart = () => {
    const blocks: WorkoutBlock[] = [];

    BLOCK_TYPES.forEach((bt, index) => {
      const blockData = blockExercises[bt.type];
      const isStrength = bt.type === 'strength';

      if (isStrength) {
        const flatExercises: WorkoutExercise[] = [];
        for (let setNum = 1; setNum <= DEFAULT_SET_COUNT; setNum++) {
          const setExerciseIds = blockData[setNum] || [];
          setExerciseIds.forEach(id => {
            const exercise = getExerciseById(id);
            flatExercises.push({
              exerciseId: id,
              weight: exercise?.defaultWeight,
              reps: exercise?.defaultReps,
              duration: exercise?.defaultDuration,
              sets: setNum,
            });
          });
        }
        if (flatExercises.length > 0) {
          blocks.push({
            id: `${bt.type}-${index}`,
            type: bt.type,
            name: bt.label,
            exercises: flatExercises,
          });
        }
      } else {
        const exerciseIds = blockData[1] || [];
        if (exerciseIds.length > 0) {
          blocks.push({
            id: `${bt.type}-${index}`,
            type: bt.type,
            name: bt.label,
            exercises: exerciseIds.map(id => {
              const exercise = getExerciseById(id);
              return {
                exerciseId: id,
                weight: exercise?.defaultWeight,
                reps: exercise?.defaultReps,
                duration: exercise?.defaultDuration,
              };
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
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-16 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Build Workout</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add exercises to each block</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="space-y-4 flex-1">
        {BLOCK_TYPES.map((blockConfig) => {
          const isStrength = blockConfig.type === 'strength';
          const sets = isStrength ? [1, 2, 3] : [1];
          const exerciseCount = getBlockExerciseCount(blockConfig.type);

          return (
            <div key={blockConfig.type} className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Block Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {getBlockIcon(blockConfig.type)}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{blockConfig.label}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Sets */}
              <div className="p-4 space-y-5">
                {sets.map((setNum) => {
                  const setExercises = blockExercises[blockConfig.type][setNum] || [];
                  const isAddingHere = addingToBlock === blockConfig.type && addingToSet === setNum;
                  const filteredExercises = isAddingHere ? getFilteredExercises(blockConfig.type, setNum) : [];

                  return (
                    <div key={setNum} className={`rounded-xl ${isStrength ? 'bg-slate-50/50 dark:bg-slate-900/30 p-3' : ''}`}>
                      {/* Set with vertical bar */}
                      <div className="flex">
                        {/* Vertical bar column */}
                        <div className="flex flex-col items-center mr-3">
                          <div className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0" />
                          <div className="w-1.5 flex-1 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                        </div>

                        {/* Content column */}
                        <div className="flex-1 min-w-0">
                          {/* Set Header */}
                          <div className="flex items-center justify-between mb-3 h-6">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                              {isStrength ? `Set ${setNum}` : 'Exercises'}
                            </span>
                            {!isAddingHere && (
                              <button
                                onClick={() => {
                                  setAddingToBlock(blockConfig.type);
                                  setAddingToSet(setNum);
                                  setExerciseSearch('');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add
                              </button>
                            )}
                          </div>

                          {/* Exercise List */}
                          <div className="space-y-1">
                            {setExercises.length === 0 && !isAddingHere && (
                              <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                                No exercises yet
                              </div>
                            )}
                            {setExercises.map((exerciseId, exerciseIdx) => {
                              const exercise = getExerciseById(exerciseId);
                              const areaLabel = exercise?.area ? exercise.area.charAt(0).toUpperCase() + exercise.area.slice(1) : '';
                              const areaColorClass = exercise?.area ? getAreaColor(exercise.area) : '';
                              const isFirst = exerciseIdx === 0;
                              const isLast = exerciseIdx === setExercises.length - 1;

                              const isSwiping = swipingExercise?.blockType === blockConfig.type &&
                                swipingExercise?.setNum === setNum &&
                                swipingExercise?.exerciseIdx === exerciseIdx;

                              return (
                                <div
                                  key={`${exerciseId}-${exerciseIdx}`}
                                  className="relative overflow-hidden rounded-lg"
                                >
                                  {/* Delete background - only show when swiping */}
                                  {isSwiping && (
                                    <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-end pr-4">
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </div>
                                  )}

                                  {/* Exercise card */}
                                  <div
                                    onTouchStart={(e) => handleTouchStart(e, blockConfig.type, setNum, exerciseIdx, e.currentTarget)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    className="relative flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                                    style={{ willChange: 'transform' }}
                                  >
                                    {/* Reorder buttons */}
                                    <div className="shrink-0 flex flex-col -my-1">
                                      <button
                                        onClick={() => moveExercise(blockConfig.type, setNum, exerciseIdx, 'up')}
                                        disabled={isFirst}
                                        className={`p-0.5 rounded transition-colors ${isFirst ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90'}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => moveExercise(blockConfig.type, setNum, exerciseIdx, 'down')}
                                        disabled={isLast}
                                        className={`p-0.5 rounded transition-colors ${isLast ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90'}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                    {/* Movement type badge - colored */}
                                    {areaLabel && (
                                      <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${areaColorClass}`}>
                                        {areaLabel}
                                      </span>
                                    )}
                                    <span className="flex-1 min-w-0 text-base font-medium text-slate-700 dark:text-slate-200 truncate">
                                      {exercise?.name || exerciseId}
                                    </span>
                                    <span className="shrink-0 text-sm text-slate-400 dark:text-slate-500 tabular-nums">
                                      {exercise?.defaultReps && `${exercise.defaultReps} reps`}
                                      {exercise?.defaultDuration && `${exercise.defaultDuration}s`}
                                    </span>
                                    {/* Copy to next set - only for strength block and not last set */}
                                    {isStrength && setNum < DEFAULT_SET_COUNT && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToNextSet(blockConfig.type, setNum, exerciseId);
                                        }}
                                        className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors"
                                        title="Copy to next set"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add exercise inline */}
                            {isAddingHere && (
                              <div className="mt-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="relative">
                                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={exerciseSearch}
                                    onChange={e => setExerciseSearch(e.target.value)}
                                    placeholder="Search exercises..."
                                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                                    autoFocus
                                  />
                                </div>
                                <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                                  {filteredExercises.map(ex => {
                                    const areaLabel = ex.area.charAt(0).toUpperCase() + ex.area.slice(1);
                                    const areaColorClass = getAreaColor(ex.area);
                                    return (
                                      <button
                                        key={ex.id}
                                        onClick={() => addExercise(blockConfig.type, setNum, ex.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                      >
                                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${areaColorClass}`}>
                                          {areaLabel}
                                        </span>
                                        <span className="text-base font-medium text-slate-700 dark:text-slate-200">{ex.name}</span>
                                      </button>
                                    );
                                  })}
                                  {filteredExercises.length === 0 && exerciseSearch && (
                                    <div className="py-4 text-center text-sm text-slate-400">No exercises found</div>
                                  )}
                                  {/* Create New Exercise button */}
                                  <button
                                    onClick={() => openCreateExercise(blockConfig.type, setNum)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mt-2"
                                  >
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </span>
                                    <span className="text-base font-medium text-emerald-600 dark:text-emerald-400">Create New Exercise</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setAddingToBlock(null); setAddingToSet(null); }}
                                  className="mt-3 w-full py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          disabled={totalExercises === 0}
          className="w-full"
        >
          Start Workout ({totalExercises} exercises)
        </Button>
      </div>

      {/* Create Exercise Modal */}
      {showCreateExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Exercise</h3>
              <button
                onClick={() => setShowCreateExercise(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  placeholder="e.g., Dumbbell Curl"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Movement Area */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Movement Type
                </label>
                <select
                  value={newExerciseArea}
                  onChange={e => setNewExerciseArea(e.target.value as MuscleArea)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="squat">Squat</option>
                  <option value="hinge">Hinge</option>
                  <option value="press">Press</option>
                  <option value="push">Push</option>
                  <option value="pull">Pull</option>
                  <option value="core">Core</option>
                  <option value="conditioning">Conditioning</option>
                  <option value="warmup">Warmup</option>
                  <option value="cooldown">Cooldown</option>
                  <option value="full-body">Full Body</option>
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Equipment
                </label>
                <select
                  value={newExerciseEquipment}
                  onChange={e => setNewExerciseEquipment(e.target.value as EquipmentType)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="bodyweight">Bodyweight</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="kettlebell">Kettlebell</option>
                  <option value="barbell">Barbell</option>
                  <option value="sandbag">Sandbag</option>
                  <option value="resistance-band">Resistance Band</option>
                  <option value="cable">Cable</option>
                  <option value="machine">Machine</option>
                </select>
              </div>

              {/* Reps or Duration - side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Reps
                  </label>
                  <input
                    type="number"
                    value={newExerciseReps}
                    onChange={e => {
                      setNewExerciseReps(e.target.value);
                      if (e.target.value) setNewExerciseDuration('');
                    }}
                    placeholder="10"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Duration (sec)
                  </label>
                  <input
                    type="number"
                    value={newExerciseDuration}
                    onChange={e => {
                      setNewExerciseDuration(e.target.value);
                      if (e.target.value) setNewExerciseReps('');
                    }}
                    placeholder="30"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Set either reps or duration, not both</p>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowCreateExercise(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExercise}
                disabled={!newExerciseName.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
