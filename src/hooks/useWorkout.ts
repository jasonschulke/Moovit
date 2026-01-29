/**
 * useWorkout Hook - Manages active workout session state
 *
 * Handles starting, navigating, and completing workouts.
 * Persists session state to localStorage for crash recovery.
 */

import { useState, useCallback, useEffect } from 'react';
import type { WorkoutSession, WorkoutBlock, ExerciseLog, EffortLevel, CardioType } from '../types';
import { CARDIO_TYPE_LABELS } from '../types';
import { saveCurrentSession, loadCurrentSession, addCompletedSession } from '../data/storage';
import { generateUUID } from '../utils/uuid';

/** Extended session interface with navigation state for persistence */
interface ExtendedSession extends WorkoutSession {
  currentBlockIndex?: number;
  currentExerciseIndex?: number;
  swappedExercises?: Record<string, string>;
}

export function useWorkout() {
  const [session, setSession] = useState<ExtendedSession | null>(() => {
    const loaded = loadCurrentSession() as ExtendedSession | null;
    return loaded;
  });
  const [currentBlockIndex, setCurrentBlockIndex] = useState(() => {
    const loaded = loadCurrentSession() as ExtendedSession | null;
    return loaded?.currentBlockIndex ?? 0;
  });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() => {
    const loaded = loadCurrentSession() as ExtendedSession | null;
    return loaded?.currentExerciseIndex ?? 0;
  });

  // Save session with navigation state
  useEffect(() => {
    if (session) {
      const extendedSession: ExtendedSession = {
        ...session,
        currentBlockIndex,
        currentExerciseIndex,
      };
      saveCurrentSession(extendedSession);
    } else {
      saveCurrentSession(null);
    }
  }, [session, currentBlockIndex, currentExerciseIndex]);

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

  const startCardioWorkout = useCallback((cardioType: CardioType) => {
    const newSession: WorkoutSession = {
      id: generateUUID(),
      name: CARDIO_TYPE_LABELS[cardioType],
      blocks: [],
      startedAt: new Date().toISOString(),
      exercises: [],
      cardioType,
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

  const completeWorkout = useCallback((overallEffort?: EffortLevel, distance?: number) => {
    if (!session) return;

    const completedSession: WorkoutSession = {
      ...session,
      completedAt: new Date().toISOString(),
      totalDuration: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
      overallEffort,
      distance,
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

  // Update swapped exercises in session for persistence
  const updateSwappedExercises = useCallback((swapped: Record<string, string>) => {
    setSession(prev => prev ? {
      ...prev,
      swappedExercises: swapped,
    } : null);
  }, []);

  // Update session blocks (for mid-workout editing)
  const updateSessionBlocks = useCallback((blocks: WorkoutBlock[]) => {
    setSession(prev => prev ? {
      ...prev,
      blocks,
    } : null);
  }, []);

  return {
    session,
    currentBlockIndex,
    currentExerciseIndex,
    startWorkoutWithBlocks,
    startCardioWorkout,
    logExercise,
    nextExercise,
    previousExercise,
    completeWorkout,
    cancelWorkout,
    setCurrentBlockIndex,
    setCurrentExerciseIndex,
    updateSwappedExercises,
    updateSessionBlocks,
  };
}
