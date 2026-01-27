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
  const [expandedUpcoming, setExpandedUpcoming] = useState<Set<number>>(new Set([0])); // First block expanded by default
  const [expandedCompleted, setExpandedCompleted] = useState<Set<number>>(new Set());

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

  // Area labels for grouping
  const AREA_LABELS: Record<string, string> = {
    squat: 'Squat',
    hinge: 'Hinge',
    press: 'Press',
    push: 'Push',
    pull: 'Pull',
    core: 'Core',
    conditioning: 'Conditioning',
    warmup: 'Warmup',
    cooldown: 'Cooldown',
    'full-body': 'Full Body',
  };

  // Build completed and upcoming exercises grouped by block then movement area
  const { completedByBlock, upcomingByBlock } = useMemo(() => {
    type ExerciseItem = { id: string; name: string; area: string };
    type ExerciseWithCount = ExerciseItem & { count: number };
    type AreaGroup = { area: string; areaLabel: string; exercises: ExerciseWithCount[] };
    type BlockGroup = { blockName: string; blockType: string; areaGroups: AreaGroup[]; isFullyComplete: boolean };

    const completedBlocks: BlockGroup[] = [];
    const upcomingBlocks: BlockGroup[] = [];

    blocks.forEach((block, bIdx) => {
      const completedInBlock: ExerciseItem[] = [];
      const upcomingInBlock: ExerciseItem[] = [];

      block.exercises.forEach((ex, eIdx) => {
        const exercise = getExerciseById(ex.exerciseId);
        if (!exercise) return;

        const isCurrent = bIdx === currentBlockIndex && eIdx === currentExerciseIndex;
        const isPast = bIdx < currentBlockIndex || (bIdx === currentBlockIndex && eIdx < currentExerciseIndex);

        const item: ExerciseItem = { id: exercise.id, name: exercise.name, area: exercise.area };

        if (isPast) {
          completedInBlock.push(item);
        } else if (!isCurrent) {
          upcomingInBlock.push(item);
        }
      });

      // Group by movement area with deduplication and counts
      const groupByArea = (items: ExerciseItem[], dedupe = false): AreaGroup[] => {
        const areaMap = new Map<string, ExerciseItem[]>();
        items.forEach(item => {
          const existing = areaMap.get(item.area) || [];
          existing.push(item);
          areaMap.set(item.area, existing);
        });
        return Array.from(areaMap.entries()).map(([area, exercises]) => {
          if (dedupe) {
            // Count occurrences and deduplicate
            const countMap = new Map<string, { exercise: ExerciseItem; count: number }>();
            exercises.forEach(ex => {
              const existing = countMap.get(ex.id);
              if (existing) {
                existing.count++;
              } else {
                countMap.set(ex.id, { exercise: ex, count: 1 });
              }
            });
            return {
              area,
              areaLabel: AREA_LABELS[area] || area,
              exercises: Array.from(countMap.values()).map(({ exercise, count }) => ({
                ...exercise,
                count,
              })),
            };
          }
          return {
            area,
            areaLabel: AREA_LABELS[area] || area,
            exercises: exercises.map(e => ({ ...e, count: 1 })),
          };
        });
      };

      // Block is fully complete if we've moved past it entirely
      const isFullyComplete = bIdx < currentBlockIndex;

      if (completedInBlock.length > 0) {
        completedBlocks.push({
          blockName: block.name,
          blockType: block.type,
          areaGroups: groupByArea(completedInBlock, true),
          isFullyComplete,
        });
      }

      if (upcomingInBlock.length > 0) {
        upcomingBlocks.push({
          blockName: block.name,
          blockType: block.type,
          areaGroups: groupByArea(upcomingInBlock, true),
          isFullyComplete: false, // upcoming blocks are never fully complete
        });
      }
    });

    return {
      completedByBlock: completedBlocks,
      upcomingByBlock: upcomingBlocks,
    };
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

      {/* Timeline Card - Step Dots */}
      <div className="px-4 pt-4">
        <div className="px-8 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Step Dots Progress */}
          <div className="relative flex items-center justify-between">
            {/* Connecting line (background) */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2" />
            {/* Connecting line (progress) */}
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-300"
              style={{ width: `${(currentBlockIndex / Math.max(timelineBlocks.length - 1, 1)) * 100}%` }}
            />

            {timelineBlocks.map((block, idx) => (
              <div key={idx} className="relative flex flex-col items-center z-10">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    block.isComplete
                      ? 'bg-emerald-500 text-white'
                      : block.isCurrent
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {block.isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                {/* Block Name */}
                <span className={`absolute top-10 text-[10px] font-medium whitespace-nowrap ${
                  block.isCurrent
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : block.isComplete
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {block.name}
                </span>
                {/* Set dots for current block */}
                {block.isCurrent && block.hasSets && (
                  <div className="absolute top-[52px] flex gap-1">
                    {block.sets.map((set, setIdx) => (
                      <span
                        key={setIdx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          set.isComplete
                            ? 'bg-emerald-400'
                            : set.isCurrent
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Spacer for block names and set dots below */}
          <div className="h-8" />
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

        {/* Upcoming Exercises Section */}
        {upcomingByBlock.length > 0 && (
          <section className="px-4 pt-2 pb-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Up Next</h2>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingByBlock.map((block, blockIdx) => {
                const blockExerciseCount = block.areaGroups.reduce((acc, g) =>
                  acc + g.exercises.reduce((sum, e) => sum + e.count, 0), 0);

                const isExpanded = expandedUpcoming.has(blockIdx);

                const toggleExpand = () => {
                  setExpandedUpcoming(prev => {
                    const next = new Set(prev);
                    if (next.has(blockIdx)) {
                      next.delete(blockIdx);
                    } else {
                      next.add(blockIdx);
                    }
                    return next;
                  });
                };

                return (
                  <div key={blockIdx}>
                    {/* Block Header - Clickable */}
                    <button
                      onClick={toggleExpand}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {block.blockName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {blockExerciseCount} exercises
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {/* Movement Groups - collapsible */}
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2">
                        {block.areaGroups.map((group, groupIdx) => (
                          <div key={groupIdx}>
                            {block.areaGroups.length > 1 && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">
                                {group.areaLabel}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {group.exercises.map((ex, exIdx) => (
                                <span
                                  key={exIdx}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {ex.name}
                                  {ex.count > 1 && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      ×{ex.count}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed Exercises Section - Reference only, at bottom */}
        {completedByBlock.length > 0 && (
          <section className="px-4 pt-2 pb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Completed</h2>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {completedByBlock.map((block, blockIdx) => {
                const blockExerciseCount = block.areaGroups.reduce((acc, g) =>
                  acc + g.exercises.reduce((sum, e) => sum + e.count, 0), 0);

                const toggleExpand = () => {
                  setExpandedCompleted(prev => {
                    const next = new Set(prev);
                    if (block.isFullyComplete) {
                      // For fully complete blocks, toggle normally
                      if (next.has(blockIdx)) {
                        next.delete(blockIdx);
                      } else {
                        next.add(blockIdx);
                      }
                    } else {
                      // For partially complete, track if user explicitly collapsed
                      if (next.has(blockIdx)) {
                        next.delete(blockIdx);
                      } else {
                        next.add(blockIdx);
                      }
                    }
                    return next;
                  });
                };

                // Check if user explicitly toggled a partially complete block
                const userCollapsed = !block.isFullyComplete && expandedCompleted.has(blockIdx);
                const showContent = block.isFullyComplete ? expandedCompleted.has(blockIdx) : !userCollapsed;

                return (
                  <div key={blockIdx}>
                    {/* Block Header - Clickable */}
                    <button
                      onClick={toggleExpand}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {block.blockName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {blockExerciseCount} done
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${showContent ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {/* Movement Groups - collapsible */}
                    {showContent && (
                      <div className="px-4 pb-3 space-y-2">
                        {block.areaGroups.map((group, groupIdx) => (
                          <div key={groupIdx}>
                            {block.areaGroups.length > 1 && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">
                                {group.areaLabel}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {group.exercises.map((ex, exIdx) => (
                                <span
                                  key={exIdx}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                >
                                  {ex.name}
                                  {ex.count > 1 && (
                                    <span className="text-[10px] text-emerald-500 dark:text-emerald-400">
                                      ×{ex.count}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
