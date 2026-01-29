import { useState, useEffect } from 'react';
import type { CardioType, EffortLevel } from '../types';
import { CARDIO_TYPE_LABELS, CARDIO_TYPE_ICONS } from '../types';
import { EffortPicker } from './EffortPicker';
import { Button } from './Button';
import { CowCelebration } from './CowCelebration';

interface CardioWorkoutViewProps {
  cardioType: CardioType;
  startedAt: string;
  onComplete: (effort?: EffortLevel, distance?: number) => void;
  onCancel: () => void;
}

export function CardioWorkoutView({
  cardioType,
  startedAt,
  onComplete,
  onCancel,
}: CardioWorkoutViewProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [distance, setDistance] = useState('');
  const [finalEffort, setFinalEffort] = useState<EffortLevel | undefined>();
  const [showCowCelebration, setShowCowCelebration] = useState(false);

  // Track elapsed time
  useEffect(() => {
    const startTime = new Date(startedAt).getTime();
    const updateElapsed = () => setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} min`;
  };

  // Show cancel confirmation
  if (showCancelConfirm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 bg-slate-100 dark:bg-slate-950">
        <div className="text-center max-w-sm p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">End {CARDIO_TYPE_LABELS[cardioType]}?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Your {formatDuration(elapsedTime)} session will not be saved.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)} className="flex-1">
              Keep Going
            </Button>
            <Button variant="danger" onClick={onCancel} className="flex-1">
              End
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (showComplete) {
    return (
      <div className="min-h-screen flex flex-col px-4 pt-12 pb-24 safe-top bg-slate-100 dark:bg-slate-950">
        {/* Cow celebration animation */}
        {showCowCelebration && (
          <CowCelebration onComplete={() => setShowCowCelebration(false)} />
        )}

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">{CARDIO_TYPE_ICONS[cardioType]}</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {CARDIO_TYPE_LABELS[cardioType]} Complete!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {formatDuration(elapsedTime)}
          </p>

          {/* Distance Input */}
          <div className="w-full max-w-sm mb-6">
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2 text-center">
              Distance (miles) - optional
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 text-center text-2xl font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Effort Picker */}
          <div className="w-full max-w-sm">
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
              How was your effort?
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
              const distanceNum = distance ? parseFloat(distance) : undefined;
              setTimeout(() => onComplete(finalEffort, distanceNum), 3000);
            }}
            className="w-full"
          >
            Save {CARDIO_TYPE_LABELS[cardioType]}
          </Button>
        </div>
      </div>
    );
  }

  // Main cardio workout UI
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Cardio Type */}
        <div className="text-6xl mb-4">{CARDIO_TYPE_ICONS[cardioType]}</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
          {CARDIO_TYPE_LABELS[cardioType]}
        </h1>

        {/* Large Timer */}
        <div className="text-7xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mb-12">
          {formatElapsedTime(elapsedTime)}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-lg">In Progress</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="px-4 pb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowComplete(true)}
          className="w-full"
        >
          Finish {CARDIO_TYPE_LABELS[cardioType]}
        </Button>
      </div>
    </div>
  );
}
