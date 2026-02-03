import { useState, useRef } from 'react';
import { parseHealthExport, type HealthImportResult, type ParseProgress } from '../data/healthImport';
import { importWorkoutSessions, importBodyMetrics, importActivityDays, loadSessions } from '../data/storage';
import { Button } from './Button';

type ImportStage = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

export function HealthImport() {
  const [stage, setStage] = useState<ImportStage>('idle');
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [result, setResult] = useState<HealthImportResult | null>(null);
  const [importCounts, setImportCounts] = useState<{ workouts: number; metrics: number; activity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (name.endsWith('.zip')) {
      setError('Please unzip the Apple Health export first and select the export.xml file inside.');
      return;
    }
    if (!name.endsWith('.xml')) {
      setError('Please select an export.xml file from your Apple Health export.');
      return;
    }

    setError(null);
    setStage('parsing');

    try {
      const data = await parseHealthExport(file, setProgress);
      setResult(data);
      setStage('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setError(msg);
      setStage('idle');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!result) return;
    setStage('importing');

    // Use setTimeout to let the UI update before the potentially heavy import
    setTimeout(() => {
      const workoutsAdded = importWorkoutSessions(result.workouts);
      const metricsAdded = importBodyMetrics(result.bodyMetrics);
      const activityAdded = importActivityDays(result.activityDays);

      setImportCounts({ workouts: workoutsAdded, metrics: metricsAdded, activity: activityAdded });
      setStage('done');
    }, 50);
  };

  const handleReset = () => {
    setStage('idle');
    setProgress(null);
    setResult(null);
    setImportCounts(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Count existing sessions to calculate duplicates
  const existingCount = result ? loadSessions().length : 0;

  // Date range helper
  const getDateRange = (dates: string[]): string => {
    if (dates.length === 0) return '';
    const sorted = dates.sort();
    const start = new Date(sorted[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = new Date(sorted[sorted.length - 1]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return start === end ? start : `${start} – ${end}`;
  };

  return (
    <div className="space-y-4">
      {/* Idle: File picker */}
      {stage === 'idle' && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Import workouts, body metrics, and activity data from Apple Health.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            On your iPhone: Health app → Profile icon → Export All Health Data → Unzip → Select the <span className="font-mono">export.xml</span> file.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".xml,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Select export.xml
            </div>
          </Button>

          {error && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
      )}

      {/* Parsing: Progress */}
      {stage === 'parsing' && progress && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-slate-600 dark:text-slate-300">{progress.detail}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview: Show what was found */}
      {stage === 'preview' && result && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Found data to import:
          </div>

          <div className="space-y-2">
            {/* Workouts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {result.workouts.length} Workouts
                  </div>
                  {result.workouts.length > 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {getDateRange(result.workouts.map(w => w.startedAt))}
                    </div>
                  )}
                </div>
              </div>
              {result.workouts.length > 0 && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Body Metrics */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {result.bodyMetrics.length} Body Measurements
                  </div>
                  {result.bodyMetrics.length > 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {getDateRange(result.bodyMetrics.map(m => m.date))}
                    </div>
                  )}
                </div>
              </div>
              {result.bodyMetrics.length > 0 && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Activity Days */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {result.activityDays.length} Activity Days
                  </div>
                  {result.activityDays.length > 0 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {getDateRange(result.activityDays.map(d => d.date))}
                    </div>
                  )}
                </div>
              </div>
              {result.activityDays.length > 0 && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {existingCount > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              You have {existingCount} existing workouts. Duplicates will be skipped automatically.
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleReset} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              className="flex-1"
              disabled={result.workouts.length === 0 && result.bodyMetrics.length === 0 && result.activityDays.length === 0}
            >
              Import All
            </Button>
          </div>
        </div>
      )}

      {/* Importing */}
      {stage === 'importing' && (
        <div className="flex items-center gap-3 py-4">
          <svg className="w-5 h-5 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-slate-600 dark:text-slate-300">Importing data...</span>
        </div>
      )}

      {/* Done */}
      {stage === 'done' && importCounts && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              Import complete!
            </div>
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {importCounts.workouts > 0 && (
              <div>{importCounts.workouts} new workout{importCounts.workouts !== 1 ? 's' : ''} imported</div>
            )}
            {importCounts.metrics > 0 && (
              <div>{importCounts.metrics} body measurement{importCounts.metrics !== 1 ? 's' : ''} imported</div>
            )}
            {importCounts.activity > 0 && (
              <div>{importCounts.activity} activity day{importCounts.activity !== 1 ? 's' : ''} imported</div>
            )}
            {importCounts.workouts === 0 && importCounts.metrics === 0 && importCounts.activity === 0 && (
              <div className="text-slate-400">No new data to import (all entries already exist).</div>
            )}
          </div>

          <Button variant="secondary" onClick={handleReset} className="w-full">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
