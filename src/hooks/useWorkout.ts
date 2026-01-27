import { useState, useCallback, useEffect } from 'react';
import type { WorkoutSession, WorkoutBlock, ExerciseLog, EffortLevel } from '../types';
import { saveCurrentSession, loadCurrentSession, addCompletedSession } from '../data/storage';
import { generateUUID } from '../utils/uuid';

export function useWorkout() {
  const [session, setSession] = useState<WorkoutSession | null>(() => loadCurrentSession());
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  useEffect(() => {
    saveCurrentSession(session);
  }, [session]);

  const startWorkoutWithBlocks = useCallback((blocks: WorkoutBlock[]) => {
    const newSession: WorkoutSession = {
      id: generateUUID(),
      name: 'Custom Workout',
      blocks,
      startedAt: new Date().toISOString(),
      exercises: [],
    };
    setSession(newSession);
    setCurrentBlockIndex(0);
    setCurrentExerciseIndex(0);
  }, []);

  const logExercise = useCallback((log: Omit<ExerciseLog, 'completedAt'>) => {
    if (!session) return;

    const exerciseLog: ExerciseLog = {
      ...log,
      completedAt: new Date().toISOString(),
    };

    setSession(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, exerciseLog],
    } : null);
  }, [session]);

  const nextExercise = useCallback((totalExercisesInBlock: number, totalBlocks: number) => {
    if (currentExerciseIndex < totalExercisesInBlock - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else if (currentBlockIndex < totalBlocks - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
    }
  }, [currentBlockIndex, currentExerciseIndex]);

  const previousExercise = useCallback((getBlockExerciseCount: (index: number) => number) => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    } else if (currentBlockIndex > 0) {
      const prevBlockIndex = currentBlockIndex - 1;
      setCurrentBlockIndex(prevBlockIndex);
      setCurrentExerciseIndex(getBlockExerciseCount(prevBlockIndex) - 1);
    }
  }, [currentBlockIndex, currentExerciseIndex]);

  const completeWorkout = useCallback((overallEffort?: EffortLevel) => {
    if (!session) return;

    const completedSession: WorkoutSession = {
      ...session,
      completedAt: new Date().toISOString(),
      totalDuration: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
      overallEffort,
    };

    addCompletedSession(completedSession);
    setSession(null);
    setCurrentBlockIndex(0);
    setCurrentExerciseIndex(0);
  }, [session]);

  const cancelWorkout = useCallback(() => {
    setSession(null);
    setCurrentBlockIndex(0);
    setCurrentExerciseIndex(0);
    saveCurrentSession(null);
  }, []);

  return {
    session,
    currentBlockIndex,
    currentExerciseIndex,
    startWorkoutWithBlocks,
    logExercise,
    nextExercise,
    previousExercise,
    completeWorkout,
    cancelWorkout,
    setCurrentBlockIndex,
    setCurrentExerciseIndex,
  };
}
