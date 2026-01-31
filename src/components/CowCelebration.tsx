import { useState, useEffect } from 'react';
import type { PersonalityType } from '../types';
import { loadPersonality } from '../data/storage';

interface CowCelebrationProps {
  onComplete?: () => void;
}

const COW_MESSAGES: Record<PersonalityType, string[]> = {
  neutral: [
    'Great workout!',
    'Well done!',
    'Workout complete!',
  ],
  sarcastic: [
    'Oh wow, you actually finished!',
    'Not bad... for a human.',
    'Mooo-ve over, we got a finisher here!',
  ],
  encouraging: [
    'Amazing job! So proud of you!',
    'You crushed it! Keep it up!',
    'Incredible effort today!',
  ],
  rude: [
    'Fine, that was decent. I guess.',
    'Took you long enough.',
    'Whatever. At least you finished.',
  ],
  zen: [
    'Your body thanks you.',
    'Peace through movement.',
    'Energy well spent.',
  ],
  flirty: [
    'You look amazing when you work out!',
    'Wow, that was hot!',
    'Same time tomorrow? I\'ll be waiting.',
  ],
};

export function CowCelebration({ onComplete }: CowCelebrationProps) {
  const [personality] = useState(() => loadPersonality());
  const [showAnimation, setShowAnimation] = useState(true);

  const messages = COW_MESSAGES[personality];
  const message = messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
      <div className="flex flex-col items-center animate-bounce-in">
        {/* Logo with animation */}
        <div className="relative">
          <img
            src="/logo_icon.png"
            alt="Moove"
            className="w-24 h-24 animate-wobble"
          />
          {/* Celebration particles */}
          <span className="absolute -top-4 -left-4 text-3xl animate-float-up">{'✨'}</span>
          <span className="absolute -top-2 -right-4 text-3xl animate-float-up-delayed">{'🎉'}</span>
          <span className="absolute -bottom-2 -left-6 text-3xl animate-float-up">{'⭐'}</span>
          <span className="absolute -bottom-4 -right-6 text-3xl animate-float-up-delayed">{'🎊'}</span>
        </div>

        {/* Message */}
        <div className="mt-6 px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
          <p className="text-xl font-bold text-center text-slate-900 dark:text-slate-100">
            {message}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-wobble {
          animation: wobble 0.5s ease-in-out infinite;
        }
        .animate-float-up {
          animation: floatUp 2s ease-out forwards;
        }
        .animate-float-up-delayed {
          animation: floatUp 2s ease-out 0.3s forwards;
        }
      `}</style>
    </div>
  );
}
