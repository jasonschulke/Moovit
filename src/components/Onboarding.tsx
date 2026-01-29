import { useState } from 'react';
import { saveUserName, savePersonality } from '../data/storage';
import { useAuth } from '../contexts/AuthContext';
import type { PersonalityType } from '../types';
import { PERSONALITY_OPTIONS } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Moove',
    description: 'Your personal workout tracker. Track workouts, build routines, and stay consistent.',
    highlight: null,
    type: 'welcome',
  },
  {
    title: 'Choose Your Vibe',
    description: 'How do you want the app to talk to you?',
    highlight: null,
    type: 'personality',
  },
  {
    title: 'Track Your Progress',
    description: 'See your workout history at a glance. The year grid shows your consistency - tap any day to log a workout or rest day.',
    highlight: 'home',
    type: 'feature',
  },
  {
    title: 'Start a Workout',
    description: 'Choose from your saved workouts or create a custom routine with warmup, strength, conditioning, and cooldown blocks.',
    highlight: 'workout',
    type: 'feature',
  },
  {
    title: 'Build Your Library',
    description: 'Save your favorite workouts and browse exercises. Customize routines to match your equipment and goals.',
    highlight: 'library',
    type: 'feature',
  },
  {
    title: 'Ask Coach',
    description: 'Have questions about exercises or form? Chat with Coach to get personalized guidance and add new exercises.',
    highlight: 'coach',
    type: 'feature',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType>('encouraging');
  const { signInWithEmail, isConfigured } = useAuth();
  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isWelcomeStep = currentStep.type === 'welcome';
  const isPersonalityStep = currentStep.type === 'personality';

  const finishOnboarding = async () => {
    if (userName.trim()) {
      saveUserName(userName.trim());
    }
    savePersonality(selectedPersonality);
    onComplete();
  };

  const handleNext = async () => {
    // Send magic link when leaving welcome step if email was entered
    if (isWelcomeStep && userEmail.trim() && isConfigured && !emailSent) {
      setIsLoading(true);
      const { error } = await signInWithEmail(userEmail.trim());
      setIsLoading(false);
      if (!error) {
        setEmailSent(true);
      }
    }

    if (isLast) {
      finishOnboarding();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-slate-900/80 z-0" />

      {/* Content area with mock UI */}
      <div className="relative flex-1 flex flex-col z-10">
        {/* Mock screen preview - changes based on highlighted feature */}
        <div className="flex-1 overflow-hidden opacity-40 pointer-events-none">
          {currentStep.type === 'welcome' && <MockWelcomeScreen />}
          {currentStep.type === 'personality' && <MockPersonalityScreen />}
          {currentStep.highlight === 'home' && <MockHomeScreen />}
          {currentStep.highlight === 'workout' && <MockWorkoutScreen />}
          {currentStep.highlight === 'library' && <MockLibraryScreen />}
          {currentStep.highlight === 'coach' && <MockCoachScreen />}
        </div>

        {/* Highlight overlay for nav items */}
        {currentStep.highlight && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-around px-4 pb-2">
            {['home', 'workout', 'library', 'coach', 'settings'].map((item) => (
              <div
                key={item}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                  currentStep.highlight === item
                    ? 'bg-emerald-500/30 ring-2 ring-emerald-400 scale-110'
                    : ''
                }`}
              >
                <NavIcon name={item} active={currentStep.highlight === item} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom card */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-white dark:bg-slate-800 rounded-3xl px-6 pt-6 pb-8 shadow-xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-emerald-500'
                  : i < step
                  ? 'bg-emerald-300 dark:bg-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Email sent confirmation banner */}
        {emailSent && !isWelcomeStep && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Check your email to complete sign in</span>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-3">
          {currentStep.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-sm mx-auto">
          {currentStep.description}
        </p>

        {/* Name and email input on welcome step */}
        {isWelcomeStep && (
          <div className="mb-6 space-y-3">
            <input
              type="text"
              placeholder="What's your first name?"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {isConfigured && (
              <div>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1.5">
                  Sync your workouts across devices
                </p>
              </div>
            )}
          </div>
        )}

        {/* Personality selection step */}
        {isPersonalityStep && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2">
              {PERSONALITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPersonality(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedPersonality === option.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    selectedPersonality === option.value
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!isLast && !isWelcomeStep && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isLoading || (isWelcomeStep && !userName.trim())}
            className={`${isLast || isWelcomeStep ? 'flex-1' : 'flex-[2]'} py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              isLast ? "Let's Go" : 'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock welcome screen for intro
function MockWelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center pt-24 px-8">
      {/* Logo */}
      <img src="/logo_icon.png" alt="Moove" className="h-20 mb-8 dark:invert" />

      {/* Feature highlights */}
      <div className="w-full max-w-xs space-y-4 mt-8">
        {[
          { icon: '📊', label: 'Track Progress', color: 'bg-emerald-500' },
          { icon: '💪', label: 'Build Workouts', color: 'bg-blue-500' },
          { icon: '📚', label: 'Exercise Library', color: 'bg-purple-500' },
          { icon: '💬', label: 'Ask Coach', color: 'bg-amber-500' },
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center text-lg`}>
              {feature.icon}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mock personality screen for onboarding preview
function MockPersonalityScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center pt-24 px-8">
      {/* Logo */}
      <img src="/logo_icon.png" alt="Moove" className="h-16 mb-6 dark:invert" />

      {/* Speech bubbles showing different personalities */}
      <div className="w-full max-w-xs space-y-4 mt-4">
        {[
          { label: 'Encouraging', msg: "You're doing amazing! Keep it up!", color: 'bg-emerald-500' },
          { label: 'Drill Sergeant', msg: "DROP AND GIVE ME 20!", color: 'bg-red-500' },
          { label: 'Sarcastic', msg: "Oh look who decided to workout...", color: 'bg-purple-500' },
          { label: 'Zen', msg: "Find your inner strength...", color: 'bg-cyan-500' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${item.color} flex-shrink-0`} />
            <div className="flex-1 p-3 rounded-xl rounded-tl-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">{item.label}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{item.msg}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mock home screen for onboarding preview
function MockHomeScreen() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 px-4 pt-16">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
        <img src="/moove.svg" alt="Home" className="h-5 dark:invert" />
      </div>

      {/* Greeting */}
      <div className="mb-4">
        <div className="h-6 w-40 bg-slate-300 dark:bg-slate-700 rounded mb-1" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-600 rounded" />
      </div>

      {/* This Month card */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">This Month</div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {/* Date navigation */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700" />
            <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">Thursday, January 29</div>
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700" />
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs text-slate-400">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md ${
                  i < 3 ? 'bg-transparent' :
                  i < 10 && i >= 3 ? 'bg-emerald-500' :
                  i < 15 ? 'bg-slate-200 dark:bg-slate-700' :
                  'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* This Year card */}
      <div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">This Year</div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {/* Year grid */}
          <div className="flex gap-[3px] mb-2">
            {Array.from({ length: 24 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-[11px] h-[11px] rounded-[2px] ${
                      weekIdx < 4 && dayIdx < 5 ? 'bg-emerald-500' :
                      weekIdx < 4 ? 'bg-slate-200 dark:bg-slate-700' :
                      'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Timeline */}
          <div className="flex gap-[3px]">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={`w-[11px] h-[2px] rounded-full ${
                i < 4 ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-300 dark:bg-slate-600'
              }`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock workout screen for onboarding preview
function MockWorkoutScreen() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 px-4 pt-16">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
        <img src="/workout.svg" alt="Workout" className="h-5 dark:invert" />
      </div>

      {/* Create New Workout button */}
      <div className="mb-6">
        <button className="w-full p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-semibold">Create New Workout</div>
              <div className="text-emerald-100 text-sm">Pick exercises for each block</div>
            </div>
          </div>
        </button>
      </div>

      {/* Timed Cardio */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Timed Cardio</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { emoji: '🚶', label: 'Walk' },
            { emoji: '🏃', label: 'Run' },
            { emoji: '🏔️', label: 'Trail' },
            { emoji: '🥾', label: 'Hike' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Workouts */}
      <div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Saved Workouts</div>
        <div className="space-y-2">
          {['Morning Strength', 'Full Body HIIT'].map((name, i) => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{name}</div>
                <div className="text-sm text-slate-500">3 blocks • 12 exercises</div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock library screen for onboarding preview
function MockLibraryScreen() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 px-4 pt-16">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
        <img src="/library.svg" alt="Library" className="h-5 dark:invert" />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 mb-6">
        <div className="flex-1 py-2 px-4 rounded-lg bg-white dark:bg-slate-700 text-center">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Workouts</span>
        </div>
        <div className="flex-1 py-2 px-4 text-center">
          <span className="text-sm text-slate-500">Exercises</span>
        </div>
        <div className="flex-1 py-2 px-4 text-center">
          <span className="text-sm text-slate-500">History</span>
        </div>
      </div>

      {/* Saved workouts */}
      <div className="space-y-3">
        {[
          { name: 'Morning Strength', blocks: 3, exercises: 12 },
          { name: 'Full Body HIIT', blocks: 4, exercises: 16 },
          { name: 'Upper Body Focus', blocks: 2, exercises: 8 },
        ].map((workout, i) => (
          <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{workout.name}</span>
                <button className="text-slate-300 dark:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-slate-500 mt-1">{workout.blocks} blocks • {workout.exercises} exercises</div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>

      {/* Add new button */}
      <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Create New Workout</span>
      </div>
    </div>
  );
}

// Mock coach screen for onboarding preview
function MockCoachScreen() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 px-4 pt-16 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo_icon.png" alt="Moove" className="h-9 dark:invert" />
        <img src="/chat.svg" alt="Coach" className="h-5 dark:invert" />
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-4">
        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] p-3 rounded-2xl rounded-br-md bg-emerald-500 text-white">
            <p className="text-sm">What's the proper form for a deadlift?</p>
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] p-3 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Great question! Here are the key points for proper deadlift form:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4">
              <li>• Keep your back straight and core tight</li>
              <li>• Feet shoulder-width apart</li>
              <li>• Grip the bar just outside your legs</li>
              <li>• Drive through your heels</li>
            </ul>
          </div>
        </div>

        {/* User follow-up */}
        <div className="flex justify-end">
          <div className="max-w-[80%] p-3 rounded-2xl rounded-br-md bg-emerald-500 text-white">
            <p className="text-sm">Can you add deadlifts to my exercise library?</p>
          </div>
        </div>

        {/* Assistant response */}
        <div className="flex justify-start">
          <div className="max-w-[80%] p-3 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Done! I've added "Deadlift" to your custom exercises. You can find it in your Library under Exercises.
            </p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="mt-4 mb-24 flex gap-2">
        <div className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-sm">
          Ask about exercises, form, or workouts...
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Nav icons for highlighting
function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'text-emerald-400' : 'text-slate-400';

  switch (name) {
    case 'home':
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'workout':
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'library':
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'coach':
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}
