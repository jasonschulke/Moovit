interface NavBarProps {
  currentPage: 'home' | 'workout' | 'library' | 'chat' | 'settings';
  onNavigate: (page: 'home' | 'workout' | 'library' | 'chat' | 'settings') => void;
  hasActiveWorkout: boolean;
}

export function NavBar({ currentPage, onNavigate, hasActiveWorkout }: NavBarProps) {
  const getButtonClass = (page: string) => {
    const isActive = currentPage === page;
    return `flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
      isActive
        ? 'text-slate-800 dark:text-slate-100'
        : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
    }`;
  };

  const getStrokeWidth = (page: string) => {
    return currentPage === page ? 2.5 : 2;
  };

  const getFontWeight = (page: string) => {
    return currentPage === page ? 'font-medium' : '';
  };

  const isWorkoutActive = currentPage === 'workout';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <button onClick={() => onNavigate('home')} className={getButtonClass('home')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={getStrokeWidth('home')} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={`text-xs ${getFontWeight('home')}`}>Home</span>
        </button>

        <button onClick={() => onNavigate('library')} className={getButtonClass('library')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={getStrokeWidth('library')} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span className={`text-xs ${getFontWeight('library')}`}>Library</span>
        </button>

        {/* Center Workout button with floating circle */}
        <button
          onClick={() => onNavigate('workout')}
          className="relative flex flex-col items-center gap-1 px-3 py-2"
        >
          {/* Floating circle - center aligned with top border of nav */}
          <div className={`absolute -top-7 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all bg-emerald-500 ${
            hasActiveWorkout
              ? 'shadow-emerald-500/40 animate-pulse-slow'
              : 'shadow-emerald-500/30'
          }`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Dumbbell / Exercise icon */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M4 8v8M20 8v8M2 10v4M22 10v4" />
            </svg>
          </div>
          {/* Spacer to maintain alignment with other tabs */}
          <div className="w-6 h-6" />
          <span className={`text-xs ${isWorkoutActive ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>Workout</span>
        </button>

        <button onClick={() => onNavigate('chat')} className={getButtonClass('chat')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={getStrokeWidth('chat')} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className={`text-xs ${getFontWeight('chat')}`}>Coach</span>
        </button>

        <button onClick={() => onNavigate('settings')} className={getButtonClass('settings')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={getStrokeWidth('settings')} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={getStrokeWidth('settings')} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className={`text-xs ${getFontWeight('settings')}`}>Settings</span>
        </button>
      </div>
    </nav>
  );
}
