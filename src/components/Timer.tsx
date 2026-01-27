import { useEffect, useState } from 'react';
import { useTimer } from '../hooks/useTimer';

interface TimerProps {
  duration?: number;
  onComplete?: () => void;
  enlarged?: boolean;
  autoStart?: boolean;
}

export function Timer({ duration, onComplete, enlarged: propEnlarged = false, autoStart = false }: TimerProps) {
  const timer = useTimer();
  const [manualEnlarge, setManualEnlarge] = useState(false);

  // Auto-enlarge when timer is running
  const enlarged = propEnlarged || manualEnlarge || timer.isRunning;

  useEffect(() => {
    if (autoStart) {
      if (duration) {
        timer.startCountdown(duration);
      } else {
        timer.startStopwatch();
      }
    }
  }, [duration, autoStart]);

  useEffect(() => {
    if (timer.isCountdown && timer.seconds === 0 && !timer.isRunning) {
      onComplete?.();
    }
  }, [timer.seconds, timer.isRunning, timer.isCountdown, onComplete]);

  const handleToggle = () => {
    if (!timer.isRunning && timer.seconds === 0 && duration) {
      timer.startCountdown(duration);
    } else if (!timer.isRunning && timer.seconds === 0) {
      timer.startStopwatch();
    } else {
      timer.toggle();
    }
  };

  const handleReset = () => {
    timer.reset(duration || 0);
  };

  const handleEnlargeToggle = () => {
    setManualEnlarge(!manualEnlarge);
  };

  return (
    <div className={`flex flex-col items-center transition-all duration-300 ${enlarged ? 'py-6' : 'py-1'}`}>
      {/* Timer display - compact by default, large when running/enlarged */}
      <div
        onClick={handleEnlargeToggle}
        className={`font-mono font-bold text-center transition-all duration-300 cursor-pointer select-none ${
          enlarged
            ? 'text-[90px] leading-none text-emerald-500 dark:text-emerald-400'
            : 'text-3xl text-slate-800 dark:text-slate-100'
        }`}
      >
        {timer.formatTime()}
      </div>

      <div className={`flex gap-3 transition-all duration-300 ${enlarged ? 'mt-6' : 'mt-2'}`}>
        <button
          onClick={handleToggle}
          className={`rounded-full flex items-center justify-center transition-all active:scale-95 ${
            enlarged ? 'w-16 h-16' : 'w-11 h-11'
          } ${
            timer.isRunning
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {timer.isRunning ? (
            <svg className={`text-white ${enlarged ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`text-white ml-0.5 ${enlarged ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleReset}
          className={`rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 flex items-center justify-center transition-all active:scale-95 ${
            enlarged ? 'w-16 h-16' : 'w-11 h-11'
          }`}
        >
          <svg className={`text-slate-700 dark:text-white ${enlarged ? 'w-7 h-7' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {enlarged && (
        <div className="text-center mt-3">
          <div className="text-slate-500 dark:text-slate-400 text-base">
            {timer.isRunning ? 'Tap to pause' : 'Tap to start'}
          </div>
          {!timer.isRunning && (
            <div className="text-slate-400 dark:text-slate-500 text-xs mt-1.5">
              Tap time to minimize
            </div>
          )}
        </div>
      )}
    </div>
  );
}
