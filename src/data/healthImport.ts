/**
 * Apple Health XML Export Parser
 *
 * Parses the export.xml file from Apple Health and maps data
 * to Moove's internal types (WorkoutSession, BodyMetric, ActivityDay).
 *
 * Uses chunk-based streaming to handle large files (100MB+) without
 * exceeding JavaScript's string length limits.
 */

import type { WorkoutSession, BodyMetric, ActivityDay, CardioType, BlockType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthImportResult {
  workouts: WorkoutSession[];
  bodyMetrics: BodyMetric[];
  activityDays: ActivityDay[];
}

export interface ParseProgress {
  phase: 'reading' | 'parsing' | 'done';
  percent: number;
  detail: string;
}

// ============================================================================
// WORKOUT TYPE MAPPING
// ============================================================================

interface WorkoutTypeMapping {
  name: string;
  cardioType?: CardioType;
  blockType: BlockType;
}

const WORKOUT_TYPE_MAP: Record<string, WorkoutTypeMapping> = {
  'HKWorkoutActivityTypeRunning': { name: 'Run', cardioType: 'run', blockType: 'cardio' },
  'HKWorkoutActivityTypeWalking': { name: 'Walk', cardioType: 'walk', blockType: 'cardio' },
  'HKWorkoutActivityTypeHiking': { name: 'Hike', cardioType: 'hike', blockType: 'cardio' },
  'HKWorkoutActivityTypeCycling': { name: 'Cycling', blockType: 'cardio' },
  'HKWorkoutActivityTypeTraditionalStrengthTraining': { name: 'Strength Training', blockType: 'strength' },
  'HKWorkoutActivityTypeFunctionalStrengthTraining': { name: 'Functional Training', blockType: 'strength' },
  'HKWorkoutActivityTypeYoga': { name: 'Yoga', blockType: 'cooldown' },
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': { name: 'HIIT', blockType: 'conditioning' },
  'HKWorkoutActivityTypeRowing': { name: 'Rowing', blockType: 'cardio' },
  'HKWorkoutActivityTypeCoreTraining': { name: 'Core Training', blockType: 'strength' },
  'HKWorkoutActivityTypeFlexibility': { name: 'Flexibility', blockType: 'cooldown' },
  'HKWorkoutActivityTypePilates': { name: 'Pilates', blockType: 'strength' },
  'HKWorkoutActivityTypeElliptical': { name: 'Elliptical', blockType: 'cardio' },
  'HKWorkoutActivityTypeStairClimbing': { name: 'Stair Climbing', blockType: 'cardio' },
  'HKWorkoutActivityTypeCrossTraining': { name: 'Cross Training', blockType: 'conditioning' },
  'HKWorkoutActivityTypeMixedCardio': { name: 'Mixed Cardio', blockType: 'cardio' },
  'HKWorkoutActivityTypeSwimming': { name: 'Swimming', blockType: 'cardio' },
  'HKWorkoutActivityTypeDance': { name: 'Dance', blockType: 'conditioning' },
  'HKWorkoutActivityTypeCooldown': { name: 'Cooldown', blockType: 'cooldown' },
  'HKWorkoutActivityTypeTrailRunning': { name: 'Trail Run', cardioType: 'trail-run', blockType: 'cardio' },
};

// ============================================================================
// PARSING (CHUNK-BASED)
// ============================================================================

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

/**
 * Parse an Apple Health export.xml file.
 * Reads the file in 10MB chunks to avoid "invalid string length" errors
 * on large exports (100MB+).
 */
export async function parseHealthExport(
  file: File,
  onProgress: (progress: ParseProgress) => void
): Promise<HealthImportResult> {
  // Check file type
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.zip')) {
    throw new Error('Please unzip the Apple Health export first and select the export.xml file inside.');
  }
  if (!fileName.endsWith('.xml')) {
    throw new Error('Please select an export.xml file.');
  }

  const sizeMB = Math.round(file.size / 1024 / 1024);
  onProgress({ phase: 'parsing', percent: 0, detail: `Processing file (${sizeMB} MB)...` });

  const workouts: WorkoutSession[] = [];
  const bodyMetricsMap = new Map<string, BodyMetric>();
  const activityDays: ActivityDay[] = [];

  let remainder = '';

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const slice = file.slice(offset, end);
    const chunkText = await slice.text();

    const text = remainder + chunkText;

    let processable: string;
    if (end < file.size) {
      // Find a safe split point after the last complete element.
      // Prefer </Workout> boundaries to keep workout context intact.
      const lastWorkoutClose = text.lastIndexOf('</Workout>');
      const lastSelfClose = text.lastIndexOf('/>');
      const splitAt = Math.max(
        lastSelfClose >= 0 ? lastSelfClose + 2 : -1,
        lastWorkoutClose >= 0 ? lastWorkoutClose + '</Workout>'.length : -1,
      );

      if (splitAt > 0) {
        processable = text.substring(0, splitAt);
        remainder = text.substring(splitAt);
      } else {
        // No complete elements found yet - carry forward
        remainder = text;
        continue;
      }
    } else {
      // Last chunk - process everything
      processable = text;
      remainder = '';
    }

    // Extract data from this chunk
    extractWorkoutsFromChunk(processable, workouts);
    extractBodyMetricsFromChunk(processable, bodyMetricsMap);
    extractActivityDaysFromChunk(processable, activityDays);

    const pct = Math.round((end / file.size) * 95);
    onProgress({
      phase: 'parsing',
      percent: pct,
      detail: `Processing (${Math.round(end / 1024 / 1024)}/${sizeMB} MB) — ${workouts.length} workouts, ${bodyMetricsMap.size} measurements, ${activityDays.length} activity days`,
    });
  }

  // Sort results
  workouts.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const bodyMetrics = Array.from(bodyMetricsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  activityDays.sort((a, b) => a.date.localeCompare(b.date));

  onProgress({
    phase: 'done',
    percent: 100,
    detail: `Found ${workouts.length} workouts, ${bodyMetrics.length} measurements, ${activityDays.length} activity days`,
  });

  return { workouts, bodyMetrics, activityDays };
}

// ============================================================================
// WORKOUT EXTRACTION
// ============================================================================

const WORKOUT_REGEX = /<Workout\s[^>]*?workoutActivityType="([^"]*)"[^>]*?duration="([^"]*)"[^>]*?durationUnit="([^"]*)"[^>]*?startDate="([^"]*)"[^>]*?endDate="([^"]*)"[^>]*?\/?>/g;

function extractWorkoutsFromChunk(chunk: string, workouts: WorkoutSession[]): void {
  WORKOUT_REGEX.lastIndex = 0;
  let match;
  while ((match = WORKOUT_REGEX.exec(chunk)) !== null) {
    const [fullMatch, activityType, durationStr, durationUnit, startDate, endDate] = match;

    const mapping = WORKOUT_TYPE_MAP[activityType] || {
      name: formatActivityType(activityType),
      blockType: 'conditioning' as BlockType,
    };

    // Parse duration to seconds
    let durationSeconds = parseFloat(durationStr);
    if (durationUnit === 'min') durationSeconds *= 60;
    else if (durationUnit === 'hr') durationSeconds *= 3600;

    // Extract distance and energy from surrounding Workout context
    const contextEnd = chunk.indexOf('</Workout>', match.index);
    const context = contextEnd > match.index
      ? chunk.substring(match.index, contextEnd + 10)
      : fullMatch;

    const distance = extractMetadataValue(context, 'HKQuantityTypeIdentifierDistanceWalkingRunning')
      || extractMetadataValue(context, 'HKQuantityTypeIdentifierDistanceCycling');
    const energy = extractMetadataValue(context, 'HKQuantityTypeIdentifierActiveEnergyBurned');

    // Convert distance from km to miles if present
    const distanceMiles = distance ? distance * 0.621371 : undefined;

    // Estimate effort from active energy (rough mapping to RPE 1-10)
    const effort = energy ? estimateEffort(energy, durationSeconds) : undefined;

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      name: mapping.name,
      blocks: [{
        id: crypto.randomUUID(),
        type: mapping.blockType,
        name: mapping.name,
        exercises: [],
      }],
      startedAt: new Date(startDate).toISOString(),
      completedAt: new Date(endDate).toISOString(),
      exercises: [],
      totalDuration: Math.round(durationSeconds),
      ...(effort && { overallEffort: effort }),
      ...(mapping.cardioType && { cardioType: mapping.cardioType }),
      ...(distanceMiles && { distance: Math.round(distanceMiles * 100) / 100 }),
    };

    workouts.push(session);
  }
}

function extractMetadataValue(context: string, typeIdentifier: string): number | null {
  const statRegex = new RegExp(
    `type="${typeIdentifier}"[^>]*?sum="([^"]*)"`,
  );
  const statMatch = statRegex.exec(context);
  if (statMatch) return parseFloat(statMatch[1]);

  const qtyRegex = new RegExp(
    `type="${typeIdentifier}"[^>]*?quantity="([^"]*)"`,
  );
  const qtyMatch = qtyRegex.exec(context);
  if (qtyMatch) return parseFloat(qtyMatch[1]);

  return null;
}

function estimateEffort(activeCalories: number, durationSeconds: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 {
  const calPerMin = activeCalories / (durationSeconds / 60);
  if (calPerMin < 3) return 2;
  if (calPerMin < 5) return 3;
  if (calPerMin < 7) return 4;
  if (calPerMin < 9) return 5;
  if (calPerMin < 11) return 6;
  if (calPerMin < 13) return 7;
  if (calPerMin < 15) return 8;
  if (calPerMin < 18) return 9;
  return 10;
}

function formatActivityType(type: string): string {
  return type
    .replace('HKWorkoutActivityType', '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

// ============================================================================
// BODY METRICS EXTRACTION
// ============================================================================

const BODY_MASS_REGEX = /<Record\s[^>]*?type="HKQuantityTypeIdentifierBodyMass"[^>]*?value="([^"]*)"[^>]*?unit="([^"]*)"[^>]*?startDate="([^"]*)"[^>]*?\/?>/g;
const BODY_FAT_REGEX = /<Record\s[^>]*?type="HKQuantityTypeIdentifierBodyFatPercentage"[^>]*?value="([^"]*)"[^>]*?startDate="([^"]*)"[^>]*?\/?>/g;

function extractBodyMetricsFromChunk(chunk: string, metrics: Map<string, BodyMetric>): void {
  // Body mass records
  BODY_MASS_REGEX.lastIndex = 0;
  let match;
  while ((match = BODY_MASS_REGEX.exec(chunk)) !== null) {
    const [, valueStr, unit, dateStr] = match;
    let weight = parseFloat(valueStr);
    if (unit === 'kg') weight = weight * 2.20462;

    const date = new Date(dateStr).toISOString().split('T')[0];
    const existing = metrics.get(date) || { date, source: 'apple_health' };
    existing.weight = Math.round(weight * 10) / 10;
    metrics.set(date, existing);
  }

  // Body fat records
  BODY_FAT_REGEX.lastIndex = 0;
  while ((match = BODY_FAT_REGEX.exec(chunk)) !== null) {
    const [, valueStr,, dateStr] = match;
    const bodyFat = parseFloat(valueStr) * 100;

    const date = new Date(dateStr).toISOString().split('T')[0];
    const existing = metrics.get(date) || { date, source: 'apple_health' };
    existing.bodyFat = Math.round(bodyFat * 10) / 10;
    metrics.set(date, existing);
  }
}

// ============================================================================
// ACTIVITY SUMMARY EXTRACTION
// ============================================================================

const ACTIVITY_SUMMARY_REGEX = /<ActivitySummary\s[^>]*?dateComponents="([^"]*)"[^>]*?activeEnergyBurned="([^"]*)"[^>]*?appleExerciseTime="([^"]*)"[^>]*?appleStandHours="([^"]*)"[^>]*?\/?>/g;

function extractActivityDaysFromChunk(chunk: string, days: ActivityDay[]): void {
  ACTIVITY_SUMMARY_REGEX.lastIndex = 0;
  let match;
  while ((match = ACTIVITY_SUMMARY_REGEX.exec(chunk)) !== null) {
    const [, date, energy, exerciseTime, standHours] = match;
    days.push({
      date,
      activeEnergy: Math.round(parseFloat(energy)),
      exerciseMinutes: Math.round(parseFloat(exerciseTime)),
      standHours: Math.round(parseFloat(standHours)),
    });
  }
}
