import { useState, useMemo, useEffect } from 'react';
import type { WorkoutSession, EffortLevel, WorkoutBlock } from '../types';
import { ExerciseView } from '../components/ExerciseView';
import { EffortPicker } from '../components/EffortPicker';
import { Button } from '../components/Button';
import { CowCelebration } from '../components/CowCelebration';
import { CardioWorkoutView } from '../components/CardioWorkoutView';
import { getExerciseById, getAllExercises } from '../data/exercises';
import { incrementSkipCount, incrementSwapCount } from '../data/storage';

// Extended session type with persisted state
interface ExtendedSession extends WorkoutSession {
  currentBlockIndex?: number;
  currentExerciseIndex?: number;
  swappedExercises?: Record<string, string>;
}

interface WorkoutPageProps {
  session: ExtendedSession | null;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  onLogExercise: (log: {
    exerciseId: string;
    weight?: number;
    reps?: number;
    duration?: number;
  }) => void;
  onNextExercise: (totalInBlock: number, totalBlocks: number) => void;
  onPreviousExercise: (getBlockExerciseCount: (index: number) => number) => void;
  onCompleteWorkout: (effort?: EffortLevel, distance?: number) => void;
  onCancelWorkout: () => void;
  onStartWorkout: () => void;
  onUpdateSwappedExercises?: (swapped: Record<string, string>) => void;
  onUpdateSessionBlocks?: (blocks: WorkoutBlock[]) => void;
}

export function WorkoutPage({
  session,
  currentBlockIndex,
  currentExerciseIndex,
  onLogExercise,
  onNextExercise,
  onPreviousExercise,
  onCompleteWorkout,
  onCancelWorkout,
  onStartWorkout,
  onUpdateSwappedExercises,
  onUpdateSessionBlocks,
}: WorkoutPageProps) {
  // === ALL HOOKS MUST BE AT THE TOP ===
  // Initialize swapped exercises from session (for persistence)
  const [swappedExercises, setSwappedExercises] = useState<Record<string, string>>(
    () => session?.swappedExercises ?? {}
  );
  const [showComplete, setShowComplete] = useState(false);
  const [finalEffort, setFinalEffort] = useState<EffortLevel | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<number>>(new Set([0]));
  const [showCowCelebration, setShowCowCelebration] = useState(false);
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [showAddInGroup, setShowAddInGroup] = useState<number | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  // Compute derived values (not hooks, just calculations)
  const blocks = session?.blocks ?? [];
  const currentBlock = blocks[currentBlockIndex];
  const currentExercise = currentBlock?.exercises[currentExerciseIndex];
  const currentSetNumber = currentExercise?.sets;
  const swapKey = `${currentBlockIndex}-${currentExerciseIndex}`;

  // Track elapsed time
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.startedAt).getTime();
    const updateElapsed = () => setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Auto-show completion if workout ended (no more exercises)
  useEffect(() => {
    if (session && blocks.length > 0 && !currentBlock && !showComplete) {
      setShowComplete(true);
    }
  }, [session, blocks.length, currentBlock, showComplete]);

  // Build timeline segments - grouped by block
  const timelineBlocks = useMemo(() => {
    return blocks.map((block, bIdx) => {
      const setsInBlock = [...new Set(block.exercises.map(e => e.sets).filter(Boolean))];
      const hasSets = setsInBlock.length > 1;
      const isBlockComplete = bIdx < currentBlockIndex;
      const isBlockCurrent = bIdx === currentBlockIndex;

      const sets = hasSets
        ? setsInBlock.map(setNum => ({
            setNum,
            isCurrent: isBlockCurrent && setNum === currentSetNumber,
            isComplete: isBlockComplete || (isBlockCurrent && setNum !== undefined && currentSetNumber !== undefined && setNum < currentSetNumber),
          }))
        : [];

      return {
        name: block.name,
        blockIdx: bIdx,
        hasSets,
        sets,
        isCurrent: isBlockCurrent,
        isComplete: isBlockComplete,
      };
    });
  }, [blocks, currentBlockIndex, currentSetNumber]);

  // Build upcoming exercises grouped by set - with completion status and indices for editing
  const upcomingGroups = useMemo(() => {
    type ExerciseItem = { id: string; name: string; exerciseId: string; isCompleted: boolean; isCurrent: boolean; blockIdx: number; exerciseIdx: number; setNum?: number };
    type UpcomingGroup = { label: string; exercises: ExerciseItem[]; type: 'set' | 'block'; remainingCount: number; blockIdx: number; setNum?: number };

    const groups: UpcomingGroup[] = [];

    if (currentBlock) {
      const blockHasSets = [...new Set(currentBlock.exercises.map(e => e.sets).filter(Boolean))].length > 1;

      if (blockHasSets && currentSetNumber) {
        const setGroups = new Map<number, ExerciseItem[]>();

        // Include ALL exercises in current set/block for color-coding
        currentBlock.exercises.forEach((ex, eIdx) => {
          const exercise = getExerciseById(ex.exerciseId);
          if (!exercise) return;
          const setNum = ex.sets || 1;
          const existing = setGroups.get(setNum) || [];
          existing.push({
            id: exercise.id,
            name: exercise.name,
            exerciseId: ex.exerciseId,
            isCompleted: eIdx < currentExerciseIndex,
            isCurrent: eIdx === currentExerciseIndex,
            blockIdx: currentBlockIndex,
            exerciseIdx: eIdx,
            setNum,
          });
          setGroups.set(setNum, existing);
        });

        // Current set first - show all exercises with completion status
        const currentSetExercises = setGroups.get(currentSetNumber);
        if (currentSetExercises && currentSetExercises.length > 0) {
          const remainingCount = currentSetExercises.filter(e => !e.isCompleted && !e.isCurrent).length;
          groups.push({
            label: `Set ${currentSetNumber}`,
            exercises: currentSetExercises,
            type: 'set',
            remainingCount,
            blockIdx: currentBlockIndex,
            setNum: currentSetNumber,
          });
        }

        // Future sets
        Array.from(setGroups.entries())
          .filter(([setNum]) => setNum > currentSetNumber)
          .sort((a, b) => a[0] - b[0])
          .forEach(([setNum, exercises]) => {
            groups.push({
              label: `Set ${setNum}`,
              exercises,
              type: 'set',
              remainingCount: exercises.length,
              blockIdx: currentBlockIndex,
              setNum,
            });
          });
      } else {
        // No sets - show all exercises in block
        const allExercises: ExerciseItem[] = [];
        currentBlock.exercises.forEach((ex, eIdx) => {
          const exercise = getExerciseById(ex.exerciseId);
          if (!exercise) return;
          allExercises.push({
            id: exercise.id,
            name: exercise.name,
            exerciseId: ex.exerciseId,
            isCompleted: eIdx < currentExerciseIndex,
            isCurrent: eIdx === currentExerciseIndex,
            blockIdx: currentBlockIndex,
            exerciseIdx: eIdx,
          });
        });
        if (allExercises.length > 0) {
          const remainingCount = allExercises.filter(e => !e.isCompleted && !e.isCurrent).length;
          groups.push({
            label: currentBlock.name,
            exercises: allExercises,
            type: 'set',
            remainingCount,
            blockIdx: currentBlockIndex,
          });
        }
      }
    }

    // Future blocks
    blocks.forEach((block, bIdx) => {
      if (bIdx <= currentBlockIndex) return;
      const exercises: ExerciseItem[] = [];
      block.exercises.forEach((ex, eIdx) => {
        const exercise = getExerciseById(ex.exerciseId);
        if (!exercise) return;
        exercises.push({
          id: exercise.id,
          name: exercise.name,
          exerciseId: ex.exerciseId,
          isCompleted: false,
          isCurrent: false,
          blockIdx: bIdx,
          exerciseIdx: eIdx,
        });
      });
      if (exercises.length > 0) {
        groups.push({ label: block.name, exercises, type: 'block', remainingCount: exercises.length, blockIdx: bIdx });
      }
    });

    return groups;
  }, [blocks, currentBlock, currentBlockIndex, currentExerciseIndex, currentSetNumber]);

  // Build completed count
  const completedCount = useMemo(() => {
    let count = 0;
    blocks.forEach((block, bIdx) => {
      block.exercises.forEach((_, eIdx) => {
        if (bIdx < currentBlockIndex || (bIdx === currentBlockIndex && eIdx < currentExerciseIndex)) {
          count++;
        }
      });
    });
    return count;
  }, [blocks, currentBlockIndex, currentExerciseIndex]);

  // === ALL HOOKS ARE NOW DONE - EARLY RETURNS CAN HAPPEN BELOW ===

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cardio workout - render CardioWorkoutView
  if (session && session.cardioType) {
    return (
      <CardioWorkoutView
        cardioType={session.cardioType}
        startedAt={session.startedAt}
        onComplete={onCompleteWorkout}
        onCancel={onCancelWorkout}
      />
    );
  }

  // No active workout
  if (!session || !session.blocks || session.blocks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No Active Workout</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Start a workout from the home screen</p>
          <Button variant="primary" size="lg" onClick={onStartWorkout}>
            Start Workout
          </Button>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (showComplete) {
    const duration = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60);
    return (
      <div className="min-h-screen flex flex-col px-4 pt-12 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
        {/* Cow celebration animation */}
        {showCowCelebration && (
          <CowCelebration onComplete={() => setShowCowCelebration(false)} />
        )}

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Workout Complete!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {duration} min • {session.exercises.length} exercises
          </p>
          <div className="w-full max-w-sm">
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
              How was your overall effort?
            </label>
            <EffortPicker value={finalEffort} onChange={setFinalEffort} />
          </div>
        </div>
        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setShowCowCelebration(true);
              // Delay the actual completion to let animation play
              setTimeout(() => onCompleteWorkout(finalEffort), 3000);
            }}
            className="w-full"
          >
            Save Workout
          </Button>
        </div>
      </div>
    );
  }

  // Show end workout confirmation
  if (showCancelConfirm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 bg-slate-100 dark:bg-slate-950">
        <div className="text-center max-w-sm p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">End Workout?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Your progress ({session.exercises.length} exercises) will be lost.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)} className="flex-1">
              Keep Going
            </Button>
            <Button variant="danger" onClick={onCancelWorkout} className="flex-1">
              End
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No current exercise (workout ended)
  if (!currentBlock || !currentExercise) {
    return <div className="min-h-screen bg-slate-100 dark:bg-slate-950" />;
  }

  // === MAIN WORKOUT UI ===
  const isLastExercise =
    currentBlockIndex === blocks.length - 1 &&
    currentExerciseIndex === (currentBlock.exercises.length) - 1;

  const totalSetsInBlock = [...new Set(currentBlock.exercises.map(e => e.sets).filter(Boolean))].length;
  const hasMultipleSets = totalSetsInBlock > 1;

  const exercisesInCurrentSet = currentSetNumber
    ? currentBlock.exercises.filter(e => e.sets === currentSetNumber)
    : [];
  const exerciseIndexInSet = currentSetNumber
    ? currentBlock.exercises.slice(0, currentExerciseIndex + 1).filter(e => e.sets === currentSetNumber).length
    : 0;

  const effectiveExerciseId = swappedExercises[swapKey] || currentExercise.exerciseId;
  const effectiveExercise = { ...currentExercise, exerciseId: effectiveExerciseId };

  const handleComplete = (log: Parameters<typeof onLogExercise>[0]) => {
    onLogExercise(log);
    if (isLastExercise) {
      setShowComplete(true);
    } else {
      onNextExercise(currentBlock.exercises.length, blocks.length);
    }
  };

  const handleSkip = () => {
    // Track the skip
    incrementSkipCount(effectiveExerciseId);

    if (isLastExercise) {
      setShowComplete(true);
    } else {
      onNextExercise(currentBlock.exercises.length, blocks.length);
    }
  };

  const handleSwap = (newExerciseId: string) => {
    // Track the swap (track original exercise being swapped out)
    incrementSwapCount(effectiveExerciseId);
    const newSwapped = { ...swappedExercises, [swapKey]: newExerciseId };
    setSwappedExercises(newSwapped);
    // Persist to session
    onUpdateSwappedExercises?.(newSwapped);
  };

  const handleBack = () => {
    const getBlockExerciseCount = (idx: number) => blocks[idx]?.exercises.length ?? 0;
    onPreviousExercise(getBlockExerciseCount);
  };

  // Delete exercise from workout at specific position
  const handleDeleteExerciseAt = (blockIdx: number, exerciseIdx: number) => {
    if (!session) return;

    const newBlocks = [...blocks];
    const block = newBlocks[blockIdx];
    if (!block) return;

    const newExercises = [...block.exercises];
    newExercises.splice(exerciseIdx, 1);

    // If block is now empty, remove it
    if (newExercises.length === 0) {
      newBlocks.splice(blockIdx, 1);
    } else {
      newBlocks[blockIdx] = { ...block, exercises: newExercises };
    }

    // Update session blocks
    onUpdateSessionBlocks?.(newBlocks);

    // If workout is now empty, show completion
    if (newBlocks.length === 0) {
      setShowComplete(true);
    }
  };

  // Add exercise to specific block/set
  const handleAddExerciseToGroup = (exerciseId: string, blockIdx: number, setNum?: number) => {
    if (!session) return;

    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;

    const newExercise = {
      exerciseId,
      weight: exercise.defaultWeight,
      reps: exercise.defaultReps,
      duration: exercise.defaultDuration,
      sets: setNum,
    };

    const newBlocks = [...blocks];
    const block = newBlocks[blockIdx];
    if (!block) return;

    const newExercises = [...block.exercises];

    // Find position to insert (after last exercise of same set, or at end)
    if (setNum) {
      const lastSetIdx = newExercises.map((e, i) => e.sets === setNum ? i : -1).filter(i => i !== -1).pop();
      if (lastSetIdx !== undefined) {
        newExercises.splice(lastSetIdx + 1, 0, newExercise);
      } else {
        newExercises.push(newExercise);
      }
    } else {
      newExercises.push(newExercise);
    }

    newBlocks[blockIdx] = { ...block, exercises: newExercises };
    onUpdateSessionBlocks?.(newBlocks);
    setShowAddInGroup(null);
    setExerciseSearchQuery('');
  };

  // Get available exercises for adding
  const availableExercises = getAllExercises().filter(e => {
    if (!exerciseSearchQuery) return true;
    return e.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase());
  }).slice(0, 10);

  const isFirstExercise = currentBlockIndex === 0 && currentExerciseIndex === 0;

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-slate-100 dark:bg-slate-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 safe-top">
        <div className="flex justify-between items-center px-4 py-3">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src="/logo_icon.png" alt="Moove" className="h-8 dark:invert" />
          <button
            onClick={() => setShowComplete(true)}
            className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-sm font-medium"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex gap-1 mb-2">
            {timelineBlocks.map((block, idx) => {
              let progressPercent = 0;
              if (block.isComplete) {
                progressPercent = 100;
              } else if (block.isCurrent && currentBlock) {
                progressPercent = (currentExerciseIndex / currentBlock.exercises.length) * 100;
              }
              return (
                <div key={idx} className="flex-1">
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className={`text-[10px] mt-1 text-center truncate ${
                    block.isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : block.isComplete ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {block.name}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentBlock.name}</div>
              {hasMultipleSets && currentSetNumber && (
                <div className="text-sm text-slate-500 dark:text-slate-400">Set {currentSetNumber} of {totalSetsInBlock}</div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                  {formatElapsedTime(elapsedTime)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">elapsed</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {hasMultipleSets && currentSetNumber
                    ? `${exerciseIndexInSet}/${exercisesInCurrentSet.length}`
                    : `${currentExerciseIndex + 1}/${currentBlock.exercises.length}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">exercises</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Current Exercise */}
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
            <ExerciseView
              workoutExercise={effectiveExercise}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onSwapExercise={handleSwap}
              onBack={handleBack}
              canGoBack={!isFirstExercise}
            />
          </div>
        </div>

        {/* Upcoming Exercises */}
        {upcomingGroups.length > 0 && (
          <section className="px-4 pt-2 pb-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Up Next</h2>
            <div className="space-y-3">
              {upcomingGroups.map((group, groupIdx) => {
                const isExpanded = expandedUpcoming.has(groupIdx);
                const isEditing = editingGroup === groupIdx;
                const isAddingHere = showAddInGroup === groupIdx;
                const toggleExpand = () => {
                  setExpandedUpcoming(prev => {
                    const next = new Set(prev);
                    if (next.has(groupIdx)) next.delete(groupIdx);
                    else next.add(groupIdx);
                    return next;
                  });
                };
                const toggleEdit = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setEditingGroup(isEditing ? null : groupIdx);
                  setShowAddInGroup(null);
                };
                return (
                  <div key={groupIdx} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <button onClick={toggleExpand} className="flex-1 flex items-center text-left">
                        <div>
                          <span className={`text-sm font-medium ${group.type === 'set' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {group.label}
                          </span>
                          {group.remainingCount > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                              {group.remainingCount} remaining
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleEdit}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isEditing ? 'Done editing' : 'Edit set'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={toggleExpand} className="p-1.5">
                          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-2">
                          {group.exercises.map((ex, exIdx) => (
                            <span
                              key={exIdx}
                              className={`px-2.5 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                                ex.isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                  : ex.isCurrent
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 dark:ring-amber-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {ex.isCompleted && (
                                <svg className="w-3 h-3 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {ex.name}
                              {isEditing && !ex.isCompleted && !ex.isCurrent && (
                                <button
                                  onClick={() => handleDeleteExerciseAt(ex.blockIdx, ex.exerciseIdx)}
                                  className="ml-1 p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 text-red-500"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => setShowAddInGroup(isAddingHere ? null : groupIdx)}
                              className="px-2.5 py-1 text-sm rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add
                            </button>
                          )}
                        </div>
                        {/* Add exercise dropdown */}
                        {isAddingHere && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={exerciseSearchQuery}
                              onChange={(e) => setExerciseSearchQuery(e.target.value)}
                              placeholder="Search exercises..."
                              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                              autoFocus
                            />
                            <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                              {availableExercises.map(ex => (
                                <button
                                  key={ex.id}
                                  onClick={() => handleAddExerciseToGroup(ex.id, group.blockIdx, group.setNum)}
                                  className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                >
                                  <span className="text-slate-800 dark:text-slate-200">{ex.name}</span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{ex.area}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed count */}
        {completedCount > 0 && (
          <section className="px-4 pt-2 pb-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {completedCount} exercise{completedCount !== 1 ? 's' : ''} completed
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
