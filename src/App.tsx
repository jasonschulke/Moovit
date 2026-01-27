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

      {currentPage === 'settings' && <SettingsPage theme={theme} onToggleTheme={toggleTheme} />}

      <NavBar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        hasActiveWorkout={!!workout.session && (workout.session.blocks?.length ?? 0) > 0}
      />
    </div>
  );
}

export default App;
