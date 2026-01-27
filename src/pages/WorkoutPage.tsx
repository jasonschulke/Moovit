import { useState, useMemo, useEffect } from 'react';
import type { WorkoutSession, EffortLevel } from '../types';
import { ExerciseView } from '../components/ExerciseView';
import { EffortPicker } from '../components/EffortPicker';
import { Button } from '../components/Button';
import { getExerciseById } from '../data/exercises';

interface WorkoutPageProps {
  session: WorkoutSession | null;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  onLogExercise: (log: {
    exerciseId: string;
    weight?: number;
    reps?: number;
    duration?: number;
  }) => void;
  onNextExercise: (totalInBlock: number, totalBlocks: number) => void;
  onCompleteWorkout: (effort?: EffortLevel) => void;
  onCancelWorkout: () => void;
  onStartWorkout: () => void;
}

export function WorkoutPage({
  session,
  currentBlockIndex,
  currentExerciseIndex,
  onLogExercise,
  onNextExercise,
  onCompleteWorkout,
  onCancelWorkout,
  onStartWorkout,
}: WorkoutPageProps) {
  const [swappedExercises, setSwappedExercises] = useState<Record<string, string>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [finalEffort, setFinalEffort] = useState<EffortLevel | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<number>>(new Set([0]));

  // Track elapsed time
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.startedAt).getTime();
    const updateElapsed = () => setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const blocks = session.blocks;
  const currentBlock = blocks[currentBlockIndex];
  const currentExercise = currentBlock?.exercises[currentExerciseIndex];

  if (!currentBlock || !currentExercise) {
    if (!showComplete) {
      setShowComplete(true);
    }
  }

  // Check if workout is complete
  const isLastExercise =
    currentBlockIndex === blocks.length - 1 &&
    currentExerciseIndex === (currentBlock?.exercises.length ?? 0) - 1;

  // Calculate current set info (for blocks with sets)
  const currentSetNumber = currentExercise?.sets;
  const totalSetsInBlock = currentBlock
    ? [...new Set(currentBlock.exercises.map(e => e.sets).filter(Boolean))].length
    : 0;
  const hasMultipleSets = totalSetsInBlock > 1;

  // Calculate exercise position within current set
  const exercisesInCurrentSet = currentBlock && currentSetNumber
    ? currentBlock.exercises.filter(e => e.sets === currentSetNumber)
    : [];
  const exerciseIndexInSet = currentExercise && currentSetNumber
    ? currentBlock?.exercises.slice(0, currentExerciseIndex + 1).filter(e => e.sets === currentSetNumber).length
    : 0;

  // Get effective exercise ID (after swaps)
  const swapKey = `${currentBlockIndex}-${currentExerciseIndex}`;
  const effectiveExerciseId = swappedExercises[swapKey] || currentExercise?.exerciseId;
  const effectiveExercise = currentExercise
    ? { ...currentExercise, exerciseId: effectiveExerciseId }
    : null;

  // Build upcoming exercises grouped by set (for current block) then by future blocks
  const upcomingGroups = useMemo(() => {
    type ExerciseItem = { id: string; name: string; exerciseId: string };
    type UpcomingGroup = { label: string; exercises: ExerciseItem[]; type: 'set' | 'block' };

    const groups: UpcomingGroup[] = [];

    // Current block - group remaining by set
    if (currentBlock) {
      const blockHasSets = [...new Set(currentBlock.exercises.map(e => e.sets).filter(Boolean))].length > 1;

      if (blockHasSets && currentSetNumber) {
        // Group remaining exercises by set
        const setGroups = new Map<number, ExerciseItem[]>();

        currentBlock.exercises.forEach((ex, eIdx) => {
          if (eIdx <= currentExerciseIndex) return; // Skip current and past
          const exercise = getExerciseById(ex.exerciseId);
          if (!exercise) return;

          const setNum = ex.sets || 1;
          const existing = setGroups.get(setNum) || [];
          existing.push({ id: exercise.id, name: exercise.name, exerciseId: ex.exerciseId });
          setGroups.set(setNum, existing);
        });

        // Add current set remaining first
        const currentSetRemaining = setGroups.get(currentSetNumber);
        if (currentSetRemaining && currentSetRemaining.length > 0) {
          groups.push({
            label: `Remaining in Set ${currentSetNumber}`,
            exercises: currentSetRemaining,
            type: 'set',
          });
        }

        // Add future sets
        Array.from(setGroups.entries())
          .filter(([setNum]) => setNum > currentSetNumber)
          .sort((a, b) => a[0] - b[0])
          .forEach(([setNum, exercises]) => {
            groups.push({
              label: `Set ${setNum}`,
              exercises,
              type: 'set',
            });
          });
      } else {
        // No sets - just show remaining exercises
        const remaining: ExerciseItem[] = [];
        currentBlock.exercises.forEach((ex, eIdx) => {
          if (eIdx <= currentExerciseIndex) return;
          const exercise = getExerciseById(ex.exerciseId);
          if (!exercise) return;
          remaining.push({ id: exercise.id, name: exercise.name, exerciseId: ex.exerciseId });
        });

        if (remaining.length > 0) {
          groups.push({
            label: 'Remaining',
            exercises: remaining,
            type: 'set',
          });
        }
      }
    }

    // Future blocks
    blocks.forEach((block, bIdx) => {
      if (bIdx <= currentBlockIndex) return;

      const exercises: ExerciseItem[] = [];
      block.exercises.forEach(ex => {
        const exercise = getExerciseById(ex.exerciseId);
        if (!exercise) return;
        exercises.push({ id: exercise.id, name: exercise.name, exerciseId: ex.exerciseId });
      });

      if (exercises.length > 0) {
        groups.push({
          label: block.name,
          exercises,
          type: 'block',
        });
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

  const handleComplete = (log: Parameters<typeof onLogExercise>[0]) => {
    onLogExercise(log);
    if (isLastExercise) {
      setShowComplete(true);
    } else {
      onNextExercise(currentBlock.exercises.length, blocks.length);
    }
  };

  const handleSkip = () => {
    if (isLastExercise) {
      setShowComplete(true);
    } else {
      onNextExercise(currentBlock.exercises.length, blocks.length);
    }
  };

  const handleSwap = (newExerciseId: string) => {
    setSwappedExercises(prev => ({
      ...prev,
      [swapKey]: newExerciseId,
    }));
  };

  const handleFinishWorkout = () => {
    onCompleteWorkout(finalEffort);
  };

  // Completion screen
  if (showComplete) {
    const duration = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60);

    return (
      <div className="min-h-screen flex flex-col px-4 pt-12 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
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
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-3 text-left">
              How was your overall effort?
            </label>
            <EffortPicker value={finalEffort} onChange={setFinalEffort} />
          </div>
        </div>

        <div className="mt-8">
          <Button variant="primary" size="lg" onClick={handleFinishWorkout} className="w-full">
            Save Workout
          </Button>
        </div>
      </div>
    );
  }

  // Cancel confirmation
  if (showCancelConfirm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 bg-slate-100 dark:bg-slate-950">
        <div className="text-center max-w-sm p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Cancel Workout?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Your progress ({session.exercises.length} exercises) will be lost.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)} className="flex-1">
              Keep Going
            </Button>
            <Button variant="danger" onClick={onCancelWorkout} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-slate-100 dark:bg-slate-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 safe-top">
        {/* Top Actions */}
        <div className="flex justify-between items-center px-4 py-3">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {currentBlock?.name}
              {hasMultipleSets && currentSetNumber && (
                <span className="font-normal text-slate-600 dark:text-slate-400"> – Set {currentSetNumber} of {totalSetsInBlock}</span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {hasMultipleSets && currentSetNumber ? (
                <>Exercise {exerciseIndexInSet} of {exercisesInCurrentSet.length} • {formatElapsedTime(elapsedTime)}</>
              ) : (
                <>{currentExerciseIndex + 1} of {currentBlock?.exercises.length} • {formatElapsedTime(elapsedTime)}</>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowComplete(true)}
            className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-sm font-medium"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Progress Card - Clear block/set/exercise indicator */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Block progress bar with labels */}
          <div className="flex gap-1 mb-2">
            {timelineBlocks.map((block, idx) => {
              // Calculate progress percentage for current block
              let progressPercent = 0;
              if (block.isComplete) {
                progressPercent = 100;
              } else if (block.isCurrent && currentBlock) {
                const totalExercises = currentBlock.exercises.length;
                // currentExerciseIndex is 0-based, so this gives completed count
                progressPercent = (currentExerciseIndex / totalExercises) * 100;
              }

              return (
                <div key={idx} className="flex-1">
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className={`text-[10px] mt-1 text-center truncate ${
                    block.isCurrent
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : block.isComplete
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {block.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current position */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {currentBlock?.name}
              </div>
              {hasMultipleSets && currentSetNumber && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Set {currentSetNumber} of {totalSetsInBlock}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {hasMultipleSets && currentSetNumber
                  ? `${exerciseIndexInSet}/${exercisesInCurrentSet.length}`
                  : `${currentExerciseIndex + 1}/${currentBlock?.exercises.length}`
                }
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                exercises
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Current Exercise View - Primary focus */}
        {effectiveExercise && currentBlock && (
          <div className="px-4 pt-4 pb-2">
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
              <ExerciseView
                workoutExercise={effectiveExercise}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onSwapExercise={handleSwap}
              />
            </div>
          </div>
        )}

        {/* Upcoming Exercises - Collapsible cards grouped by set */}
        {upcomingGroups.length > 0 && (
          <section className="px-4 pt-2 pb-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Up Next</h2>
            <div className="space-y-3">
              {upcomingGroups.map((group, groupIdx) => {
                const isExpanded = expandedUpcoming.has(groupIdx);
                const toggleExpand = () => {
                  setExpandedUpcoming(prev => {
                    const next = new Set(prev);
                    if (next.has(groupIdx)) {
                      next.delete(groupIdx);
                    } else {
                      next.add(groupIdx);
                    }
                    return next;
                  });
                };

                return (
                  <div
                    key={groupIdx}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={toggleExpand}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <span className={`text-sm font-medium ${
                          group.type === 'set'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {group.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                          {group.exercises.length} exercise{group.exercises.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-2">
                          {group.exercises.map((ex, exIdx) => (
                            <span
                              key={exIdx}
                              className="px-2.5 py-1 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {ex.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed count - minimal */}
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
