import { useState, useRef, useMemo } from 'react';
import type { BlockType, WorkoutExercise, WorkoutBlock, MuscleArea, EquipmentType, SavedWorkout } from '../types';
import { useExercises } from '../contexts/ExerciseContext';
import { useSignUpPrompt } from '../contexts/SignUpPromptContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from './Button';

interface WorkoutBuilderProps {
  onStart: (blocks: WorkoutBlock[]) => void;
  onCancel: () => void;
  editWorkout?: SavedWorkout;  // If provided, edit this workout
  onSave?: (workout: SavedWorkout) => void;  // Callback for saving edited workout
}

const BLOCK_TYPE_CONFIG: Record<BlockType, { label: string; areas: MuscleArea[]; icon: string }> = {
  warmup: { label: 'Warm-up', areas: ['warmup', 'core', 'full-body'], icon: 'physical_therapy' },
  strength: { label: 'Strength', areas: ['squat', 'hinge', 'press', 'push', 'pull', 'core'], icon: 'exercise' },
  conditioning: { label: 'Conditioning', areas: ['conditioning', 'core', 'full-body'], icon: 'ecg_heart' },
  cardio: { label: 'Cardio', areas: ['conditioning', 'full-body'], icon: 'directions_run' },
  cooldown: { label: 'Cooldown', areas: ['warmup', 'core', 'cooldown'], icon: 'self_improvement' },
};

// Block type icons using Material Symbols
const getBlockIcon = (type: BlockType) => {
  const config = BLOCK_TYPE_CONFIG[type];
  return (
    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
      {config?.icon || 'fitness_center'}
    </span>
  );
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

interface BuilderBlock {
  id: string;
  type: BlockType;
  exercises: Record<number, string[]>; // setNum -> exerciseIds
}

// Convert WorkoutBlocks to BuilderBlocks for editing
function workoutBlocksToBuilderBlocks(workoutBlocks: WorkoutBlock[]): BuilderBlock[] {
  return workoutBlocks.map(block => {
    const exercisesBySet: Record<number, string[]> = {};

    block.exercises.forEach(exercise => {
      const setNum = exercise.sets || 1;
      if (!exercisesBySet[setNum]) {
        exercisesBySet[setNum] = [];
      }
      exercisesBySet[setNum].push(exercise.exerciseId);
    });

    return {
      id: block.id,
      type: block.type,
      exercises: exercisesBySet,
    };
  });
}

export function WorkoutBuilder({ onStart, onCancel, editWorkout, onSave }: WorkoutBuilderProps) {
  const { triggerSignUpPrompt } = useSignUpPrompt();
  const { exercises, addExercise: addCustomExercise, getExerciseById } = useExercises();
  const { showToast } = useToast();

  const isEditMode = !!editWorkout;

  // Dynamic list of blocks
  const [blocks, setBlocks] = useState<BuilderBlock[]>(() =>
    editWorkout ? workoutBlocksToBuilderBlocks(editWorkout.blocks) : []
  );

  // Workout metadata for edit mode
  const [workoutName, setWorkoutName] = useState(editWorkout?.name || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(editWorkout?.estimatedMinutes?.toString() || '');

  // Block picker modal
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [selectedBlockTypes, setSelectedBlockTypes] = useState<Set<BlockType>>(new Set());

  // Adding exercise state
  const [addingToBlockId, setAddingToBlockId] = useState<string | null>(null);
  const [addingToSet, setAddingToSet] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Swipe to delete state
  const [swipingExercise, setSwipingExercise] = useState<{ blockId: string; setNum: number; exerciseIdx: number } | null>(null);
  const swipeStartX = useRef(0);
  const swipeOffsetRef = useRef(0);
  const swipeElementRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 80;

  // Create exercise modal state
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [createForBlockId, setCreateForBlockId] = useState<string | null>(null);
  const [createForSet, setCreateForSet] = useState<number | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseArea, setNewExerciseArea] = useState<MuscleArea>('core');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<EquipmentType>('bodyweight');
  const [newExerciseReps, setNewExerciseReps] = useState<string>('');
  const [newExerciseDuration, setNewExerciseDuration] = useState<string>('');
  // Note: exercises comes from ExerciseContext via useExercises()

  // Toggle block type selection in picker
  const toggleBlockType = (type: BlockType) => {
    setSelectedBlockTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Add selected blocks
  const addSelectedBlocks = () => {
    // Sort by preferred order: warmup, strength, conditioning, cardio, cooldown
    const order: BlockType[] = ['warmup', 'strength', 'conditioning', 'cardio', 'cooldown'];
    const sorted = order.filter(t => selectedBlockTypes.has(t));

    const newBlocks: BuilderBlock[] = sorted.map((type, idx) => ({
      id: `${type}-${Date.now()}-${idx}`,
      type,
      exercises: { 1: [] },
    }));

    setBlocks(prev => [...prev, ...newBlocks]);
    setShowBlockPicker(false);
    setSelectedBlockTypes(new Set());
  };

  // Add a set to a block
  const addSetToBlock = (blockId: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      const setCount = Object.keys(block.exercises).length;
      return { ...block, exercises: { ...block.exercises, [setCount + 1]: [] } };
    }));
  };

  // Remove the last set from a block
  const removeSetFromBlock = (blockId: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      const setCount = Object.keys(block.exercises).length;
      if (setCount <= 1) return block;
      const newExercises = { ...block.exercises };
      delete newExercises[setCount];
      return { ...block, exercises: newExercises };
    }));
  };

  // Remove a block
  const removeBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  // Move block up/down
  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newBlocks = [...prev];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return newBlocks;
    });
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, blockId: string, setNum: number, exerciseIdx: number, element: HTMLDivElement | null) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeOffsetRef.current = 0;
    swipeElementRef.current = element;
    setSwipingExercise({ blockId, setNum, exerciseIdx });
    if (element) {
      element.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingExercise || !swipeElementRef.current) return;
    const diff = swipeStartX.current - e.touches[0].clientX;
    const offset = Math.max(0, Math.min(diff, 120));
    swipeOffsetRef.current = offset;
    swipeElementRef.current.style.transform = `translateX(-${offset}px)`;
  };

  const handleTouchEnd = () => {
    if (!swipingExercise) return;
    const element = swipeElementRef.current;
    if (element) {
      element.style.transition = 'transform 0.2s ease-out';
      if (swipeOffsetRef.current >= swipeThreshold) {
        element.style.transform = 'translateX(-100%)';
        setTimeout(() => {
          removeExercise(swipingExercise.blockId, swipingExercise.setNum, swipingExercise.exerciseIdx);
        }, 150);
      } else {
        element.style.transform = 'translateX(0)';
      }
    }
    setSwipingExercise(null);
    swipeOffsetRef.current = 0;
    swipeElementRef.current = null;
  };

  // Move exercise up or down in the list
  const moveExercise = (blockId: string, setNum: number, fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      const setExercises = [...(block.exercises[setNum] || [])];
      if (toIdx < 0 || toIdx >= setExercises.length) return block;
      const [removed] = setExercises.splice(fromIdx, 1);
      setExercises.splice(toIdx, 0, removed);
      return { ...block, exercises: { ...block.exercises, [setNum]: setExercises } };
    }));
  };

  const removeExercise = (blockId: string, setNum: number, exerciseIdx: number) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      const setExercises = [...(block.exercises[setNum] || [])];
      setExercises.splice(exerciseIdx, 1);
      return { ...block, exercises: { ...block.exercises, [setNum]: setExercises } };
    }));
  };

  const addExerciseToBlock = (blockId: string, setNum: number, exerciseId: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      const setExercises = [...(block.exercises[setNum] || [])];
      setExercises.push(exerciseId);
      return { ...block, exercises: { ...block.exercises, [setNum]: setExercises } };
    }));
    setExerciseSearch('');
  };

  const copyToNextSet = (blockId: string, currentSetNum: number, exerciseId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const setCount = Object.keys(block.exercises).length;
    const nextSetNum = currentSetNum + 1;
    if (nextSetNum > setCount) return;
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const nextSetExercises = [...(b.exercises[nextSetNum] || [])];
      if (!nextSetExercises.includes(exerciseId)) {
        nextSetExercises.push(exerciseId);
        return { ...b, exercises: { ...b.exercises, [nextSetNum]: nextSetExercises } };
      }
      return b;
    }));
  };

  // Open create exercise modal
  const openCreateExercise = (blockId: string, setNum: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const config = BLOCK_TYPE_CONFIG[block.type];
    setCreateForBlockId(blockId);
    setCreateForSet(setNum);
    setNewExerciseName('');
    setNewExerciseArea(config.areas[0] || 'core');
    setNewExerciseEquipment('bodyweight');
    setNewExerciseReps('');
    setNewExerciseDuration('');
    setShowCreateExercise(true);
  };

  // Handle creating a new exercise
  const handleCreateExercise = () => {
    if (!newExerciseName.trim() || !createForBlockId || createForSet === null) return;

    const newExercise = addCustomExercise({
      name: newExerciseName.trim(),
      area: newExerciseArea,
      equipment: newExerciseEquipment,
      defaultReps: newExerciseReps ? parseInt(newExerciseReps) : undefined,
      defaultDuration: newExerciseDuration ? parseInt(newExerciseDuration) : undefined,
    });

    // Exercise list auto-updates via ExerciseContext
    addExerciseToBlock(createForBlockId, createForSet, newExercise.id);
    setShowCreateExercise(false);
    setCreateForBlockId(null);
    setCreateForSet(null);
    showToast(`${newExercise.name} added to your library!`);
    triggerSignUpPrompt('exercise');
  };

  // Get filtered exercises for adding
  const getFilteredExercises = (blockId: string, setNum: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return [];
    const config = BLOCK_TYPE_CONFIG[block.type];
    const existingIds = new Set(block.exercises[setNum] || []);
    return exercises.filter(e => {
      if (existingIds.has(e.id)) return false;
      if (!config.areas.includes(e.area)) return false;
      if (!exerciseSearch) return true;
      return e.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    }).slice(0, 10);
  };

  // Get exercise count for a block
  const getBlockExerciseCount = (block: BuilderBlock) => {
    const unique = new Set<string>();
    Object.values(block.exercises).forEach(ids => ids.forEach(id => unique.add(id)));
    return unique.size;
  };

  // Get total exercise count
  const totalExercises = useMemo(() => {
    let count = 0;
    blocks.forEach(block => {
      const unique = new Set<string>();
      Object.values(block.exercises).forEach(ids => ids.forEach(id => unique.add(id)));
      count += unique.size;
    });
    return count;
  }, [blocks]);

  // Build workout blocks
  const buildWorkoutBlocks = (): WorkoutBlock[] => {
    const workoutBlocks: WorkoutBlock[] = [];

    blocks.forEach((block) => {
      const config = BLOCK_TYPE_CONFIG[block.type];
      const setCount = Object.keys(block.exercises).length;
      const flatExercises: WorkoutExercise[] = [];

      for (let setNum = 1; setNum <= setCount; setNum++) {
        const setExerciseIds = block.exercises[setNum] || [];
        setExerciseIds.forEach(id => {
          const exercise = getExerciseById(id);
          flatExercises.push({
            exerciseId: id,
            weight: exercise?.defaultWeight,
            reps: exercise?.defaultReps,
            duration: exercise?.defaultDuration,
            sets: setCount > 1 ? setNum : undefined,
          });
        });
      }

      if (flatExercises.length > 0) {
        workoutBlocks.push({
          id: block.id,
          type: block.type,
          name: config.label,
          exercises: flatExercises,
        });
      }
    });

    return workoutBlocks;
  };

  // Build workout blocks and start
  const handleStart = () => {
    const workoutBlocks = buildWorkoutBlocks();

    if (workoutBlocks.length === 0) {
      alert('Please add at least one block with exercises');
      return;
    }

    onStart(workoutBlocks);
  };

  // Save edited workout
  const handleSave = () => {
    if (!editWorkout || !onSave) return;
    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    const workoutBlocks = buildWorkoutBlocks();

    if (workoutBlocks.length === 0) {
      alert('Please add at least one block with exercises');
      return;
    }

    const updatedWorkout: SavedWorkout = {
      ...editWorkout,
      name: workoutName.trim(),
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      blocks: workoutBlocks,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedWorkout);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-16 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Edit Workout' : 'Build Workout'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEditMode ? 'Modify blocks and exercises' : 'Add blocks and exercises'}
              </p>
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

        {/* Workout name and time fields (edit mode only) */}
        {isEditMode && (
          <div className="flex gap-3 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
                placeholder="Workout name"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Time</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(e.target.value)}
                placeholder="min"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center"
              />
            </div>
          </div>
        )}
      </header>

      <div className="space-y-4 flex-1">
        {blocks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-2">No blocks yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Add a block to start building your workout</p>
          </div>
        )}

        {blocks.map((block, blockIdx) => {
          const config = BLOCK_TYPE_CONFIG[block.type];
          const setCount = Object.keys(block.exercises).length;
          const sets = Array.from({ length: setCount }, (_, i) => i + 1);
          const exerciseCount = getBlockExerciseCount(block);

          return (
            <div key={block.id} className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Block Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      {getBlockIcon(block.type)}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{config.label}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}{setCount > 1 ? ` · ${setCount} sets` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={blockIdx === 0}
                      className={`p-1.5 rounded transition-colors ${blockIdx === 0 ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={blockIdx === blocks.length - 1}
                      className={`p-1.5 rounded transition-colors ${blockIdx === blocks.length - 1 ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sets */}
              <div className="p-4 space-y-5">
                {sets.map((setNum) => {
                  const setExercises = block.exercises[setNum] || [];
                  const isAddingHere = addingToBlockId === block.id && addingToSet === setNum;
                  const filteredExercises = isAddingHere ? getFilteredExercises(block.id, setNum) : [];

                  return (
                    <div key={setNum} className={`rounded-xl ${setCount > 1 ? 'bg-slate-50/50 dark:bg-slate-900/30 p-3' : ''}`}>
                      <div className="flex">
                        <div className="flex flex-col items-center mr-3">
                          <div className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0" />
                          <div className="w-1.5 flex-1 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3 h-6">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                              {setCount > 1 ? `Set ${setNum}` : 'Exercises'}
                            </span>
                            {!isAddingHere && (
                              <button
                                onClick={() => {
                                  setAddingToBlockId(block.id);
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
                              const isSwiping = swipingExercise?.blockId === block.id &&
                                swipingExercise?.setNum === setNum &&
                                swipingExercise?.exerciseIdx === exerciseIdx;

                              return (
                                <div key={`${exerciseId}-${exerciseIdx}`} className="relative overflow-hidden rounded-lg">
                                  {isSwiping && (
                                    <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-end pr-4">
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </div>
                                  )}

                                  <div
                                    onTouchStart={(e) => handleTouchStart(e, block.id, setNum, exerciseIdx, e.currentTarget)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    className="relative flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                                    style={{ willChange: 'transform' }}
                                  >
                                    <div className="shrink-0 flex flex-col -my-1">
                                      <button
                                        onClick={() => moveExercise(block.id, setNum, exerciseIdx, 'up')}
                                        disabled={isFirst}
                                        className={`p-0.5 rounded transition-colors ${isFirst ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90'}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => moveExercise(block.id, setNum, exerciseIdx, 'down')}
                                        disabled={isLast}
                                        className={`p-0.5 rounded transition-colors ${isLast ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90'}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
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
                                    {setCount > 1 && setNum < setCount && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToNextSet(block.id, setNum, exerciseId);
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
                                    const exAreaLabel = ex.area.charAt(0).toUpperCase() + ex.area.slice(1);
                                    const exAreaColorClass = getAreaColor(ex.area);
                                    return (
                                      <button
                                        key={ex.id}
                                        onClick={() => addExerciseToBlock(block.id, setNum, ex.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                      >
                                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${exAreaColorClass}`}>
                                          {exAreaLabel}
                                        </span>
                                        <span className="text-base font-medium text-slate-700 dark:text-slate-200">{ex.name}</span>
                                      </button>
                                    );
                                  })}
                                  {filteredExercises.length === 0 && exerciseSearch && (
                                    <div className="py-4 text-center text-sm text-slate-400">No exercises found</div>
                                  )}
                                  <button
                                    onClick={() => openCreateExercise(block.id, setNum)}
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
                                  onClick={() => { setAddingToBlockId(null); setAddingToSet(null); }}
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

                {/* Add/Remove Set Controls */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => removeSetFromBlock(block.id)}
                    disabled={setCount <= 1}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      setCount <= 1
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Remove Set
                  </button>
                  <button
                    onClick={() => addSetToBlock(block.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Set
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Block Button */}
        <button
          onClick={() => setShowBlockPicker(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add Block</span>
          </div>
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {isEditMode ? (
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSave}
              disabled={totalExercises === 0 || !workoutName.trim()}
              className="w-full"
            >
              Save Changes
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStart}
              disabled={totalExercises === 0}
              className="w-full"
            >
              Start Workout ({totalExercises} exercises)
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={totalExercises === 0}
            className="w-full"
          >
            Start Workout ({totalExercises} exercises)
          </Button>
        )}
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => { setShowBlockPicker(false); setSelectedBlockTypes(new Set()); }}>
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">Add Blocks</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">Select one or more block types</p>
            </div>
            <div className="p-4 space-y-2">
              {(Object.keys(BLOCK_TYPE_CONFIG) as BlockType[]).map(type => {
                const config = BLOCK_TYPE_CONFIG[type];
                const isSelected = selectedBlockTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleBlockType(type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {getBlockIcon(type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{config.label}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {config.areas.slice(0, 3).map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '24px' }}>check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => { setShowBlockPicker(false); setSelectedBlockTypes(new Set()); }}
                className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSelectedBlocks}
                disabled={selectedBlockTypes.size === 0}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  selectedBlockTypes.size === 0
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                Add {selectedBlockTypes.size > 0 ? `${selectedBlockTypes.size} Block${selectedBlockTypes.size > 1 ? 's' : ''}` : 'Blocks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exercise Modal */}
      {showCreateExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
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

            <div className="p-5 space-y-4">
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
