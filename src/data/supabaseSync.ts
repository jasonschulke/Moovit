/**
 * Supabase Sync Service
 * Handles uploading and downloading data between localStorage and Supabase
 */

import { supabase } from '../lib/supabase';
import type { WorkoutSession, SavedWorkout, Exercise } from '../types';

// Debounce timer for sync
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000;

// Sync status callback
let onSyncStatusChange: ((status: 'idle' | 'syncing' | 'synced' | 'error') => void) | null = null;

export function setSyncStatusCallback(callback: typeof onSyncStatusChange) {
  onSyncStatusChange = callback;
}

// ============================================================================
// UPLOAD FUNCTIONS (localStorage -> Supabase)
// ============================================================================

export async function uploadWorkoutSessions(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const sessionsJson = localStorage.getItem('workout_sessions');
    if (!sessionsJson) return true;

    const sessions: WorkoutSession[] = JSON.parse(sessionsJson);
    if (sessions.length === 0) return true;

    // Upsert sessions (insert or update on conflict)
    const { error } = await supabase
      .from('workout_sessions')
      .upsert(
        sessions.map(s => ({
          id: s.id,
          user_id: userId,
          template_id: s.templateId || null,
          name: s.name,
          blocks: s.blocks,
          exercises: s.exercises,
          started_at: s.startedAt,
          completed_at: s.completedAt || null,
          total_duration: s.totalDuration || null,
          overall_effort: s.overallEffort || null,
          cardio_type: s.cardioType || null,
          distance: s.distance || null,
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upload workout sessions:', err);
    return false;
  }
}

export async function uploadSavedWorkouts(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const workoutsJson = localStorage.getItem('saved_workouts');
    if (!workoutsJson) return true;

    const workouts: SavedWorkout[] = JSON.parse(workoutsJson);
    if (workouts.length === 0) return true;

    const { error } = await supabase
      .from('saved_workouts')
      .upsert(
        workouts.map(w => ({
          id: w.id,
          user_id: userId,
          name: w.name,
          estimated_minutes: w.estimatedMinutes || null,
          blocks: w.blocks,
          cardio_type: w.cardioType || null,
          created_at: w.createdAt,
          updated_at: w.updatedAt,
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upload saved workouts:', err);
    return false;
  }
}

export async function uploadCustomExercises(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const exercisesJson = localStorage.getItem('custom_exercises');
    if (!exercisesJson) return true;

    const exercises: Exercise[] = JSON.parse(exercisesJson);
    if (exercises.length === 0) return true;

    const { error } = await supabase
      .from('custom_exercises')
      .upsert(
        exercises.map(e => ({
          id: e.id,
          user_id: userId,
          name: e.name,
          area: e.area,
          equipment: e.equipment,
          default_weight: e.defaultWeight || null,
          default_reps: typeof e.defaultReps === 'number' ? e.defaultReps : null,
          default_duration: e.defaultDuration || null,
          description: e.description || null,
          alternatives: e.alternatives || [],
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upload custom exercises:', err);
    return false;
  }
}

export async function uploadUserPreferences(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const restDaysJson = localStorage.getItem('rest_days');
    const equipmentJson = localStorage.getItem('equipment_config');
    const favoritesJson = localStorage.getItem('workout_favorites');
    const skipCountsJson = localStorage.getItem('workout_skip_counts');
    const descriptionsJson = localStorage.getItem('workout_custom_descriptions');
    const chatHistoryJson = localStorage.getItem('claude_chat_history');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        rest_days: restDaysJson ? JSON.parse(restDaysJson) : [],
        equipment_config: equipmentJson ? JSON.parse(equipmentJson) : {},
        favorites: favoritesJson ? JSON.parse(favoritesJson) : { workouts: [], exercises: [] },
        skip_counts: skipCountsJson ? JSON.parse(skipCountsJson) : {},
        custom_descriptions: descriptionsJson ? JSON.parse(descriptionsJson) : { exercises: {}, workouts: {} },
        chat_history: chatHistoryJson ? JSON.parse(chatHistoryJson) : [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upload user preferences:', err);
    return false;
  }
}

export async function uploadProfile(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const name = localStorage.getItem('workout_user_name');
    const personality = localStorage.getItem('workout_personality');
    const theme = localStorage.getItem('workout_theme');

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name || null,
        personality: personality || 'encouraging',
        theme: theme || 'dark',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upload profile:', err);
    return false;
  }
}

// ============================================================================
// DOWNLOAD FUNCTIONS (Supabase -> localStorage)
// ============================================================================

export async function downloadWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(s => ({
      id: s.id,
      templateId: s.template_id || undefined,
      name: s.name,
      blocks: s.blocks || [],
      exercises: s.exercises || [],
      startedAt: s.started_at,
      completedAt: s.completed_at || undefined,
      totalDuration: s.total_duration || undefined,
      overallEffort: s.overall_effort || undefined,
      cardioType: s.cardio_type || undefined,
      distance: s.distance || undefined,
    }));
  } catch (err) {
    console.error('Failed to download workout sessions:', err);
    return [];
  }
}

export async function downloadSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('saved_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(w => ({
      id: w.id,
      name: w.name,
      estimatedMinutes: w.estimated_minutes || undefined,
      blocks: w.blocks || [],
      cardioType: w.cardio_type || undefined,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));
  } catch (err) {
    console.error('Failed to download saved workouts:', err);
    return [];
  }
}

export async function downloadCustomExercises(userId: string): Promise<Exercise[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(e => ({
      id: e.id,
      name: e.name,
      area: e.area,
      equipment: e.equipment,
      defaultWeight: e.default_weight || undefined,
      defaultReps: e.default_reps || undefined,
      defaultDuration: e.default_duration || undefined,
      description: e.description || undefined,
      alternatives: e.alternatives || undefined,
    }));
  } catch (err) {
    console.error('Failed to download custom exercises:', err);
    return [];
  }
}

interface UserPreferences {
  rest_days: string[];
  equipment_config: Record<string, number>;
  favorites: { workouts: string[]; exercises: string[] };
  skip_counts: Record<string, { skips: number; swaps: number }>;
  custom_descriptions: { exercises: Record<string, string>; workouts: Record<string, string> };
  chat_history: Array<{ role: string; content: string; timestamp: string }>;
}

export async function downloadUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return {
      rest_days: data.rest_days || [],
      equipment_config: data.equipment_config || {},
      favorites: data.favorites || { workouts: [], exercises: [] },
      skip_counts: data.skip_counts || {},
      custom_descriptions: data.custom_descriptions || { exercises: {}, workouts: {} },
      chat_history: data.chat_history || [],
    };
  } catch (err) {
    console.error('Failed to download user preferences:', err);
    return null;
  }
}

interface Profile {
  name: string | null;
  personality: string;
  theme: string;
}

export async function downloadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, personality, theme')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      name: data.name,
      personality: data.personality || 'encouraging',
      theme: data.theme || 'dark',
    };
  } catch (err) {
    console.error('Failed to download profile:', err);
    return null;
  }
}

// ============================================================================
// FULL SYNC FUNCTIONS
// ============================================================================

export async function uploadAllData(userId: string): Promise<boolean> {
  onSyncStatusChange?.('syncing');

  const results = await Promise.all([
    uploadWorkoutSessions(userId),
    uploadSavedWorkouts(userId),
    uploadCustomExercises(userId),
    uploadUserPreferences(userId),
    uploadProfile(userId),
  ]);

  const success = results.every(r => r);
  onSyncStatusChange?.(success ? 'synced' : 'error');
  return success;
}

export async function downloadAllData(userId: string): Promise<boolean> {
  onSyncStatusChange?.('syncing');

  try {
    const [sessions, workouts, exercises, preferences, profile] = await Promise.all([
      downloadWorkoutSessions(userId),
      downloadSavedWorkouts(userId),
      downloadCustomExercises(userId),
      downloadUserPreferences(userId),
      downloadProfile(userId),
    ]);

    // Store in localStorage
    if (sessions.length > 0) {
      localStorage.setItem('workout_sessions', JSON.stringify(sessions));
    }
    if (workouts.length > 0) {
      localStorage.setItem('saved_workouts', JSON.stringify(workouts));
    }
    if (exercises.length > 0) {
      localStorage.setItem('custom_exercises', JSON.stringify(exercises));
    }
    if (preferences) {
      localStorage.setItem('rest_days', JSON.stringify(preferences.rest_days));
      localStorage.setItem('equipment_config', JSON.stringify(preferences.equipment_config));
      localStorage.setItem('workout_favorites', JSON.stringify(preferences.favorites));
      localStorage.setItem('workout_skip_counts', JSON.stringify(preferences.skip_counts));
      localStorage.setItem('workout_custom_descriptions', JSON.stringify(preferences.custom_descriptions));
      localStorage.setItem('claude_chat_history', JSON.stringify(preferences.chat_history));
    }
    if (profile) {
      if (profile.name) localStorage.setItem('workout_user_name', profile.name);
      localStorage.setItem('workout_personality', profile.personality);
      localStorage.setItem('workout_theme', profile.theme);
    }

    onSyncStatusChange?.('synced');
    return true;
  } catch (err) {
    console.error('Failed to download all data:', err);
    onSyncStatusChange?.('error');
    return false;
  }
}

// Check if cloud has any data
export async function hasCloudData(userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { count, error } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return (count || 0) > 0;
  } catch {
    return false;
  }
}

// Check if local has data
export function hasLocalData(): boolean {
  const sessions = localStorage.getItem('workout_sessions');
  const workouts = localStorage.getItem('saved_workouts');
  return !!(sessions && sessions !== '[]') || !!(workouts && workouts !== '[]');
}

// Initial sync on login
const SYNC_DONE_KEY = 'moove_initial_sync_done';

export async function performInitialSync(userId: string): Promise<void> {
  // Check if we already synced this session to prevent infinite reload loop
  const syncDoneForUser = sessionStorage.getItem(SYNC_DONE_KEY);
  if (syncDoneForUser === userId) {
    onSyncStatusChange?.('synced');
    return;
  }

  onSyncStatusChange?.('syncing');

  const cloudHasData = await hasCloudData(userId);
  const localHasData = hasLocalData();

  if (!cloudHasData && localHasData) {
    // New account with existing local data - upload
    console.log('Uploading local data to cloud...');
    await uploadAllData(userId);
    sessionStorage.setItem(SYNC_DONE_KEY, userId);
  } else if (cloudHasData && !localHasData) {
    // Existing account on new device - download
    console.log('Downloading cloud data to local...');
    await downloadAllData(userId);
    sessionStorage.setItem(SYNC_DONE_KEY, userId);
    // Reload to pick up new data
    window.location.reload();
  } else if (cloudHasData && localHasData) {
    // Both have data - upload local to merge (cloud keeps both)
    console.log('Merging local and cloud data...');
    await uploadAllData(userId);
    await downloadAllData(userId);
    sessionStorage.setItem(SYNC_DONE_KEY, userId);
    // Don't reload - data is already in localStorage
    onSyncStatusChange?.('synced');
  } else {
    // Neither has data - nothing to sync
    sessionStorage.setItem(SYNC_DONE_KEY, userId);
    onSyncStatusChange?.('synced');
  }
}

// Debounced sync trigger (call after any data change)
export function scheduleSyncToCloud(userId: string): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    uploadAllData(userId);
  }, SYNC_DEBOUNCE_MS);
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete all user data from Supabase (keeps account, just removes data)
 */
export async function deleteAllCloudData(userId: string): Promise<boolean> {
  if (!supabase) return true; // No Supabase = nothing to delete

  try {
    // Delete from all tables in parallel
    const results = await Promise.all([
      supabase.from('workout_sessions').delete().eq('user_id', userId),
      supabase.from('saved_workouts').delete().eq('user_id', userId),
      supabase.from('custom_exercises').delete().eq('user_id', userId),
      supabase.from('user_preferences').delete().eq('user_id', userId),
    ]);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors deleting cloud data:', errors.map(e => e.error));
      return false;
    }

    // Clear the sync session flag so next login will re-sync
    sessionStorage.removeItem(SYNC_DONE_KEY);

    return true;
  } catch (err) {
    console.error('Failed to delete cloud data:', err);
    return false;
  }
}

/**
 * Delete user account entirely from Supabase Auth
 * Note: This requires the user to be signed in
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not signed in' };
    }

    // First delete all user data
    await deleteAllCloudData(user.id);

    // Delete the profile (this might cascade or be handled by RLS)
    await supabase.from('profiles').delete().eq('id', user.id);

    // Sign out (we can't delete our own auth user from client-side,
    // that requires a server-side admin function)
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    console.error('Failed to delete account:', err);
    return { success: false, error: 'Failed to delete account' };
  }
}
