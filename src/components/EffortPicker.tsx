import { useState } from 'react';
import type { EffortLevel } from '../types';

interface EffortPickerProps {
  value?: EffortLevel;
  onChange: (effort: EffortLevel | undefined) => void;
}

interface EffortCategory {
  name: string;
  description: string;
  subtext: string;
  levels: EffortLevel[];
  barHeight: string; // Tailwind height class
}

const EFFORT_CATEGORIES: EffortCategory[] = [
  {
    name: 'Easy',
    description: 'Not challenging',
    subtext: 'Could go a long time',
    levels: [1, 2, 3],
    barHeight: 'h-16',
  },
  {
    name: 'Moderate',
    description: 'Working but comfortable',
    subtext: 'Could go for a while',
    levels: [4, 5, 6],
    barHeight: 'h-24',
  },
  {
    name: 'Hard',
    description: 'Challenging and uncomfortable',
    subtext: 'Could not go long at all',
    levels: [7, 8],
    barHeight: 'h-32',
  },
  {
    name: 'All Out',
    description: 'Extremely uncomfortable',
    subtext: 'Could barely continue',
    levels: [9, 10],
    barHeight: 'h-40',
  },
];

const LEVEL_LABELS: Record<EffortLevel, string> = {
  1: 'Easy',
  2: 'Easy',
  3: 'Easy',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Hard',
  8: 'Hard',
  9: 'All Out',
  10: 'All Out',
};

export function EffortPicker({ value, onChange }: EffortPickerProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Find which category contains the selected value
  const selectedCategory = value
    ? EFFORT_CATEGORIES.find(cat => cat.levels.includes(value))
    : null;

  if (showDetails) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setShowDetails(false)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select the description that best matches the workout overall.
        </p>

        {EFFORT_CATEGORIES.map((category) => (
          <div key={category.name}>
            {/* Category Header */}
            <div className="mb-2">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {category.name}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {category.description}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {category.subtext}
              </div>
            </div>

            {/* Level Options */}
            <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {category.levels.map((level, idx) => (
                <button
                  key={level}
                  onClick={() => {
                    onChange(level);
                    setShowDetails(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    idx !== category.levels.length - 1
                      ? 'border-b border-slate-200 dark:border-slate-700'
                      : ''
                  } ${
                    value === level
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                      value === level
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}>
                      {level}
                    </span>
                    <span className={`font-medium ${
                      value === level
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {LEVEL_LABELS[level]}
                    </span>
                  </div>
                  {value === level && (
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Skip Option */}
        <button
          onClick={() => {
            onChange(undefined);
            setShowDetails(false);
          }}
          className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="font-medium text-slate-700 dark:text-slate-300">Skip</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Bar Chart */}
      <div className="flex items-end justify-center gap-2 h-44 px-2">
        {EFFORT_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const selectedLevelIndex = value ? category.levels.indexOf(value) : -1;

          return (
            <div
              key={category.name}
              className={`relative flex-1 ${category.barHeight} rounded-xl bg-slate-200 dark:bg-slate-700/50 transition-all`}
            >
              {/* Dots for each level */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {category.levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => onChange(level)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      value === level
                        ? 'bg-emerald-500 scale-125'
                        : 'bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 dark:hover:bg-slate-400'
                    }`}
                    aria-label={`${level} - ${LEVEL_LABELS[level]}`}
                  />
                ))}
              </div>

              {/* Selected indicator pill */}
              {isSelected && selectedLevelIndex !== -1 && (
                <div
                  className="absolute bottom-6 rounded-full bg-emerald-500 w-3 transition-all"
                  style={{
                    height: 'calc(100% - 2rem)',
                    left: `calc(${(selectedLevelIndex + 0.5) / category.levels.length * 100}% - 6px)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Value Display */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {value ? (
            <>
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                {value}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {LEVEL_LABELS[value]}
              </span>
            </>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Tap a bar to rate your effort
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(true)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="View effort descriptions"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Skip link */}
      <button
        onClick={() => onChange(undefined)}
        className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-2"
      >
        Skip rating
      </button>
    </div>
  );
}
