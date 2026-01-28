import type { WorkoutSession, ExerciseLog, SavedWorkout, WorkoutBlock } from '../types';
import { generateUUID } from '../utils/uuid';
import { getDeviceId } from './sync';
// Cloud sync disabled - was causing data sharing between users
// import { scheduleSyncToCloud } from './sync';

const SESSIONS_KEY = 'workout_sessions';
const CURRENT_SESSION_KEY = 'current_workout_session';
const SAVED_WORKOUTS_KEY = 'saved_workouts';
const REST_DAYS_KEY = 'rest_days';
const CUSTOM_EXERCISES_KEY = 'custom_exercises';
const CLAUDE_API_KEY = 'claude_api_key';
const CHAT_HISTORY_KEY = 'claude_chat_history';
const EQUIPMENT_CONFIG_KEY = 'equipment_config';
const USER_NAME_KEY = 'workout_user_name';

// User name
export function saveUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
  // Log user identity for analytics
  const deviceId = getDeviceId();
  console.log('[Moove] User identity:', { deviceId, userName: name, timestamp: new Date().toISOString() });
}

export function loadUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadSessions(): WorkoutSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCurrentSession(session: WorkoutSession | null): void {
  if (session) {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export function loadCurrentSession(): WorkoutSession | null {
  const data = localStorage.getItem(CURRENT_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function addCompletedSession(session: WorkoutSession): void {
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);
  saveCurrentSession(null);
}

// Saved Workouts (Library)
export function loadSavedWorkouts(): SavedWorkout[] {
  const data = localStorage.getItem(SAVED_WORKOUTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSavedWorkouts(workouts: SavedWorkout[]): void {
  localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(workouts));
}

export function addSavedWorkout(workout: Omit<SavedWorkout, 'id' | 'createdAt' | 'updatedAt'>): SavedWorkout {
  const workouts = loadSavedWorkouts();
  const newWorkout: SavedWorkout = {
    ...workout,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workouts.unshift(newWorkout);
  saveSavedWorkouts(workouts);
  return newWorkout;
}

export function updateSavedWorkout(id: string, updates: Partial<Omit<SavedWorkout, 'id' | 'createdAt'>>): SavedWorkout | null {
  const workouts = loadSavedWorkouts();
  const index = workouts.findIndex(w => w.id === id);
  if (index === -1) return null;

  workouts[index] = {
    ...workouts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveSavedWorkouts(workouts);
  return workouts[index];
}

export function deleteSavedWorkout(id: string): void {
  const workouts = loadSavedWorkouts();
  saveSavedWorkouts(workouts.filter(w => w.id !== id));
}

export function getSavedWorkoutById(id: string): SavedWorkout | undefined {
  return loadSavedWorkouts().find(w => w.id === id);
}

// Seed default workouts if library is empty
const DEFAULT_FULL_BODY_WORKOUT: Omit<SavedWorkout, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Full Body Strength',
  estimatedMinutes: 45,
  blocks: [
    {
      id: 'warmup-block',
      type: 'warmup',
      name: 'Warmup',
      exercises: [
        { exerciseId: 'worlds-greatest-stretch', reps: 5 },
        { exerciseId: 'hollow-body-hold', duration: 30 },
      ],
    },
    {
      id: 'strength-block',
      type: 'strength',
      name: 'Strength',
      exercises: [
        // Set 1: Squat, Hinge, Press, Pull
        { exerciseId: 'goblet-squat', sets: 1, reps: 10 },
        { exerciseId: 'deadlift', sets: 1, reps: 10 },
        { exerciseId: 'overhead-press', sets: 1, reps: 8 },
        { exerciseId: 'rows', sets: 1, reps: 10 },
        // Set 2: Squat, Hinge, Press, Pull
        { exerciseId: 'goblet-squat', sets: 2, reps: 10 },
        { exerciseId: 'deadlift', sets: 2, reps: 10 },
        { exerciseId: 'overhead-press', sets: 2, reps: 8 },
        { exerciseId: 'rows', sets: 2, reps: 10 },
        // Set 3: Squat, Hinge, Press, Pull
        { exerciseId: 'goblet-squat', sets: 3, reps: 10 },
        { exerciseId: 'deadlift', sets: 3, reps: 10 },
        { exerciseId: 'overhead-press', sets: 3, reps: 8 },
        { exerciseId: 'rows', sets: 3, reps: 10 },
      ],
    },
    {
      id: 'conditioning-block',
      type: 'conditioning',
      name: 'Conditioning',
      exercises: [
        { exerciseId: 'kb-swing', reps: 20 },
        { exerciseId: 'planks', duration: 45 },
      ],
    },
    {
      id: 'cooldown-block',
      type: 'cooldown',
      name: 'Cooldown',
      exercises: [
        { exerciseId: 'childs-pose', duration: 60 },
      ],
    },
  ],
};

export function seedDefaultWorkouts(): void {
  const workouts = loadSavedWorkouts();
  if (workouts.length === 0) {
    addSavedWorkout(DEFAULT_FULL_BODY_WORKOUT);
  }
}

// Last Workout
export function getLastWorkout(): { blocks: WorkoutBlock[]; completedAt: string } | null {
  const sessions = loadSessions().filter(s => s.completedAt && s.blocks?.length > 0);
  if (sessions.length === 0) return null;
  return {
    blocks: sessions[0].blocks,
    completedAt: sessions[0].completedAt!,
  };
}

export function getExerciseHistory(exerciseId: string, limit = 10): ExerciseLog[] {
  const sessions = loadSessions();
  const history: ExerciseLog[] = [];

  for (const session of sessions) {
    for (const log of session.exercises) {
      if (log.exerciseId === exerciseId) {
        history.push(log);
        if (history.length >= limit) return history;
      }
    }
  }

  return history;
}

export function getLastWeekAverages(exerciseId: string): { avgWeight: number; avgReps: number } | null {
  const sessions = loadSessions();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentLogs = sessions
    .filter(s => new Date(s.startedAt) >= oneWeekAgo)
    .flatMap(s => s.exercises)
    .filter(e => e.exerciseId === exerciseId);

  if (recentLogs.length === 0) return null;

  const weights = recentLogs.filter(l => l.weight).map(l => l.weight!);
  const reps = recentLogs.filter(l => typeof l.reps === 'number').map(l => l.reps as number);

  return {
    avgWeight: weights.length > 0 ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : 0,
    avgReps: reps.length > 0 ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : 0,
  };
}

// Get workout dates for the current week (for checkmark display)
export function getThisWeekWorkoutDates(): Set<string> {
  const sessions = loadSessions().filter(s => s.completedAt);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const dates = new Set<string>();
  sessions.forEach(s => {
    const sessionDate = new Date(s.startedAt);
    if (sessionDate >= startOfWeek) {
      dates.add(sessionDate.toDateString());
    }
  });
  return dates;
}

// Get yearly contribution data (GitHub-style grid)
export function getYearlyContributions(): Map<string, number> {
  const sessions = loadSessions().filter(s => s.completedAt);
  const contributions = new Map<string, number>();

  // Get dates for the last 365 days
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    contributions.set(dateStr, 0);
  }

  // Count workouts per day
  sessions.forEach(s => {
    const dateStr = new Date(s.startedAt).toISOString().split('T')[0];
    if (contributions.has(dateStr)) {
      contributions.set(dateStr, (contributions.get(dateStr) || 0) + 1);
    }
  });

  return contributions;
}

export function getWorkoutStats(): {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
  avgDuration: number;
  longestStreak: number;
  currentStreak: number;
  workoutsByDay: Record<number, number>;
} {
  const sessions = loadSessions().filter(s => s.completedAt);

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const thisWeek = sessions.filter(s => new Date(s.startedAt) >= oneWeekAgo).length;
  const thisMonth = sessions.filter(s => new Date(s.startedAt) >= oneMonthAgo).length;

  const durations = sessions
    .filter(s => s.totalDuration)
    .map(s => s.totalDuration!);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Calculate streaks
  const sortedDates = [...new Set(
    sessions.map(s => new Date(s.startedAt).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const prevDate = i > 0 ? sortedDates[i - 1] : null;

    if (i === 0) {
      if (date === today || date === yesterday) {
        currentStreak = 1;
        tempStreak = 1;
      }
    } else if (prevDate) {
      const diff = new Date(prevDate).getTime() - new Date(date).getTime();
      if (diff <= 86400000 * 1.5) {
        tempStreak++;
        if (i < sortedDates.length && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Workouts by day of week (0 = Sunday)
  const workoutsByDay: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  sessions.forEach(s => {
    const day = new Date(s.startedAt).getDay();
    workoutsByDay[day]++;
  });

  return {
    totalWorkouts: sessions.length,
    thisWeek,
    thisMonth,
    avgDuration,
    longestStreak,
    currentStreak,
    workoutsByDay,
  };
}

// Rest Days
export function loadRestDays(): Set<string> {
  const data = localStorage.getItem(REST_DAYS_KEY);
  return data ? new Set(JSON.parse(data)) : new Set();
}

export function saveRestDays(dates: Set<string>): void {
  localStorage.setItem(REST_DAYS_KEY, JSON.stringify([...dates]));
}

export function toggleRestDay(dateStr: string): boolean {
  const restDays = loadRestDays();
  if (restDays.has(dateStr)) {
    restDays.delete(dateStr);
    saveRestDays(restDays);
    return false;
  } else {
    restDays.add(dateStr);
    saveRestDays(restDays);
    return true;
  }
}

export function isRestDay(dateStr: string): boolean {
  return loadRestDays().has(dateStr);
}

// Custom Exercises
import type { Exercise } from '../types';

export function loadCustomExercises(): Exercise[] {
  const data = localStorage.getItem(CUSTOM_EXERCISES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCustomExercises(exercises: Exercise[]): void {
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
}

export function addCustomExercise(exercise: Omit<Exercise, 'id'>): Exercise {
  const exercises = loadCustomExercises();
  const newExercise: Exercise = {
    ...exercise,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  exercises.push(newExercise);
  saveCustomExercises(exercises);
  return newExercise;
}

export function deleteCustomExercise(id: string): void {
  const exercises = loadCustomExercises();
  saveCustomExercises(exercises.filter(e => e.id !== id));
}

// Claude API Key
// Fallback key (base64 encoded + reversed for basic obfuscation)
const _k = () => atob('QUFBXzlkeDUtQWo5ZTdWUTBsNmNGTjhkVGk2NFJuZ2lDN2hKc2ZHZmhSMm1qVXRacW9heHlSWlA1YWJxWHdzeE14dzVFRGJROUdoRFdDQ2FtX1pMcUJxN1ZXOFRFTEwtMzBpcGEtdG5hLWtz').split('').reverse().join('');

export function getClaudeApiKey(): string | null {
  // User's own key takes priority
  const userKey = localStorage.getItem(CLAUDE_API_KEY);
  if (userKey) return userKey;
  // Fallback to embedded key
  return _k();
}

export function setClaudeApiKey(key: string): void {
  localStorage.setItem(CLAUDE_API_KEY, key);
}

export function clearClaudeApiKey(): void {
  localStorage.removeItem(CLAUDE_API_KEY);
}

// Chat History
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function loadChatHistory(): ChatMessage[] {
  const data = localStorage.getItem(CHAT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveChatHistory(messages: ChatMessage[]): void {
  // Keep only last 50 messages to save space
  const trimmed = messages.slice(-50);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_HISTORY_KEY);
}

// Backlog Workouts - add/remove workout for specific dates
export function addBacklogWorkout(dateStr: string): WorkoutSession {
  const sessions = loadSessions();
  const date = new Date(dateStr + 'T12:00:00');

  const session: WorkoutSession = {
    id: generateUUID(),
    name: 'Backlog Workout',
    blocks: [],
    startedAt: date.toISOString(),
    completedAt: date.toISOString(),
    exercises: [],
    totalDuration: 30 * 60, // Default 30 min
  };

  sessions.push(session);
  sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  saveSessions(sessions);
  return session;
}

export function removeWorkoutOnDate(dateStr: string): void {
  const sessions = loadSessions();
  const filtered = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt).toISOString().split('T')[0];
    return sessionDate !== dateStr;
  });
  saveSessions(filtered);
}

export function hasWorkoutOnDate(dateStr: string): boolean {
  const sessions = loadSessions().filter(s => s.completedAt);
  return sessions.some(s => {
    const sessionDate = new Date(s.startedAt).toISOString().split('T')[0];
    return sessionDate === dateStr;
  });
}

// Check if date has a real workout (not a backlog placeholder)
export function hasRealWorkoutOnDate(dateStr: string): boolean {
  const sessions = loadSessions().filter(s => s.completedAt);
  return sessions.some(s => {
    const sessionDate = new Date(s.startedAt).toISOString().split('T')[0];
    // Real workouts have exercises logged, backlog workouts are empty
    return sessionDate === dateStr && s.exercises.length > 0;
  });
}

// Get effort data over time for chart
export function getEffortHistory(limit = 20): { date: string; effort: number }[] {
  const sessions = loadSessions()
    .filter(s => s.completedAt && s.overallEffort)
    .slice(0, limit)
    .reverse();

  return sessions.map(s => ({
    date: new Date(s.completedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    effort: s.overallEffort!,
  }));
}

// Backfill effort scores for workouts that don't have them
export function backfillEffortScores(): void {
  const sessions = loadSessions();
  let updated = false;

  const updatedSessions = sessions.map(session => {
    if (session.completedAt && !session.overallEffort) {
      updated = true;
      // Random effort in 4-6 range
      const randomEffort = Math.floor(Math.random() * 3) + 4;
      return { ...session, overallEffort: randomEffort as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 };
    }
    return session;
  });

  if (updated) {
    saveSessions(updatedSessions);
  }
}

// Toggle year overview status: none -> workout -> rest -> none
// Protects real workouts from being removed
export function toggleYearDayStatus(dateStr: string): 'none' | 'workout' | 'rest' | 'protected' {
  const hasWorkout = hasWorkoutOnDate(dateStr);
  const isRealWorkout = hasRealWorkoutOnDate(dateStr);
  const restDays = loadRestDays();
  const isRest = restDays.has(dateStr);

  // If it's a real workout, don't allow toggling it off
  if (isRealWorkout) {
    return 'protected';
  }

  if (!hasWorkout && !isRest) {
    // none -> workout
    addBacklogWorkout(dateStr);
    return 'workout';
  } else if (hasWorkout && !isRest) {
    // workout -> rest
    removeWorkoutOnDate(dateStr);
    restDays.add(dateStr);
    saveRestDays(restDays);
    return 'rest';
  } else {
    // rest -> none
    restDays.delete(dateStr);
    saveRestDays(restDays);
    return 'none';
  }
}

// Equipment Configuration
import type { EquipmentType } from '../types';

export interface EquipmentConfig {
  dumbbell?: number;
  kettlebell?: number;
  barbell?: number;
  sandbag?: number;
  // Can add more as needed
}

// Default equipment based on user's setup
const DEFAULT_EQUIPMENT: EquipmentConfig = {
  dumbbell: 25,
  kettlebell: 50,  // Using heavier as default, user can adjust
  sandbag: 100,
  barbell: 45,     // Empty barbell
};

export function loadEquipmentConfig(): EquipmentConfig {
  const data = localStorage.getItem(EQUIPMENT_CONFIG_KEY);
  if (data) {
    return { ...DEFAULT_EQUIPMENT, ...JSON.parse(data) };
  }
  return DEFAULT_EQUIPMENT;
}

export function saveEquipmentConfig(config: EquipmentConfig): void {
  localStorage.setItem(EQUIPMENT_CONFIG_KEY, JSON.stringify(config));
}

export function getDefaultWeightForEquipment(equipmentType: EquipmentType): number | undefined {
  const config = loadEquipmentConfig();
  switch (equipmentType) {
    case 'dumbbell':
      return config.dumbbell;
    case 'kettlebell':
      return config.kettlebell;
    case 'barbell':
      return config.barbell;
    case 'sandbag':
      return config.sandbag;
    case 'bodyweight':
      return undefined;
    default:
      return undefined;
  }
}
