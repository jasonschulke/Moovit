import { useState, useEffect } from 'react';
import type { WorkoutBlock, EffortLevel } from './types';
import { useWorkout } from './hooks/useWorkout';
import { seedDefaultWorkouts } from './data/storage';
import { NavBar } from './components/NavBar';
import { WorkoutBuilder } from './components/WorkoutBuilder';
import { WorkoutStartFlow } from './components/WorkoutStartFlow';
import { ClaudeChat } from './components/ClaudeChat';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';

type Page = 'home' | 'workout' | 'library' | 'chat' | 'settings';
type Theme = 'dark' | 'light';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showBuilder, setShowBuilder] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('workout_theme');
    return (saved as Theme) || 'dark';
  });
  const workout = useWorkout();

  // Seed default workouts on first load
  useEffect(() => {
    seedDefaultWorkouts();
  }, []);

  // Apply theme
  useEffect(() => {
    localStorage.setItem('workout_theme', theme);
    const root = document.documentElement;

    // Tailwind dark mode only needs the 'dark' class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Navigate to workout page only when workout first starts (not on every render)
  const [hasNavigatedToWorkout, setHasNavigatedToWorkout] = useState(false);
  useEffect(() => {
    if (workout.session && workout.session.blocks?.length > 0 && !hasNavigatedToWorkout) {
      setCurrentPage('workout');
      setShowBuilder(false);
      setHasNavigatedToWorkout(true);
    }
    // Reset flag when workout ends
    if (!workout.session) {
      setHasNavigatedToWorkout(false);
    }
  }, [workout.session, hasNavigatedToWorkout]);

  const handleBuilderStart = (blocks: WorkoutBlock[]) => {
    workout.startWorkoutWithBlocks(blocks);
    setShowBuilder(false);
    setCurrentPage('workout');
  };

  const handleBuilderCancel = () => {
    setShowBuilder(false);
  };

  const handleCompleteWorkout = (effort?: EffortLevel) => {
    workout.completeWorkout(effort);
    setCurrentPage('home');
  };

  const handleCancelWorkout = () => {
    workout.cancelWorkout();
    setCurrentPage('home');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Show workout builder
  if (showBuilder) {
    return (
      <div className={theme}>
        <WorkoutBuilder
          onStart={handleBuilderStart}
          onCancel={handleBuilderCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Theme Toggle - hidden during active workout */}
      {!(currentPage === 'workout' && workout.session && (workout.session.blocks?.length ?? 0) > 0) && (
        <button
          onClick={toggleTheme}
          className={`fixed top-4 right-4 z-50 p-2 rounded-full backdrop-blur border transition-colors ${
            theme === 'dark'
              ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-white/80 border-slate-300 text-slate-600 hover:text-slate-800'
          }`}
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      )}

      {currentPage === 'home' && <HomePage />}

      {currentPage === 'workout' && (
        workout.session && workout.session.blocks?.length > 0 ? (
          <WorkoutPage
            session={workout.session}
            currentBlockIndex={workout.currentBlockIndex}
            currentExerciseIndex={workout.currentExerciseIndex}
            onLogExercise={workout.logExercise}
            onNextExercise={workout.nextExercise}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
            onStartWorkout={() => setShowBuilder(true)}
          />
        ) : (
          <WorkoutStartFlow
            onStartLastWorkout={handleBuilderStart}
            onCreateNew={() => setShowBuilder(true)}
            onStartSavedWorkout={(savedWorkout) => handleBuilderStart(savedWorkout.blocks)}
            onManageLibrary={() => setCurrentPage('library')}
          />
        )
      )}

      {currentPage === 'library' && (
        <LibraryPage onStartWorkout={handleBuilderStart} />
      )}

      {currentPage === 'chat' && <ClaudeChat />}

      {currentPage === 'settings' && <SettingsPage />}

      <NavBar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        hasActiveWorkout={!!workout.session && (workout.session.blocks?.length ?? 0) > 0}
      />
    </div>
  );
}

export default App;
