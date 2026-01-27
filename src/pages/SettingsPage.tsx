import { useState, useEffect } from 'react';
import {
  getClaudeApiKey,
  setClaudeApiKey,
  clearClaudeApiKey,
  loadCustomExercises,
  deleteCustomExercise,
  clearChatHistory,
} from '../data/storage';
import { Button } from '../components/Button';
import type { Exercise } from '../types';

export function SettingsPage() {
  const [apiKey, setApiKeyState] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setSavedKey(getClaudeApiKey());
    setCustomExercises(loadCustomExercises());
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setClaudeApiKey(apiKey.trim());
      setSavedKey(apiKey.trim());
      setApiKeyState('');
    }
  };

  const handleClearKey = () => {
    clearClaudeApiKey();
    setSavedKey(null);
    setApiKeyState('');
  };

  const handleDeleteExercise = (id: string) => {
    deleteCustomExercise(id);
    setCustomExercises(loadCustomExercises());
    setShowDeleteConfirm(null);
  };

  const handleClearChat = () => {
    clearChatHistory();
  };

  const maskedKey = savedKey ? `sk-ant-...${savedKey.slice(-8)}` : null;

  return (
    <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
      <header className="px-4 pt-14 pb-4 safe-top">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
      </header>

      <div className="px-4 space-y-6">
        {/* Claude API Key Section */}
        <section className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Claude API Key</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Required for the Claude assistant to add exercises and answer questions.
          </p>

          {savedKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <div className="flex-1">
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">
                    {showKey ? savedKey : maskedKey}
                  </span>
                </div>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <Button variant="ghost" onClick={handleClearKey} className="w-full">
                Remove API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKeyState(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <Button
                variant="primary"
                onClick={handleSaveKey}
                disabled={!apiKey.trim()}
                className="w-full"
              >
                Save API Key
              </Button>
              <p className="text-xs text-slate-500">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          )}
        </section>

        {/* Custom Exercises Section */}
        <section className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Custom Exercises</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Exercises you've added via the Claude assistant.
          </p>

          {customExercises.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              No custom exercises yet. Use the Claude assistant to add some!
            </div>
          ) : (
            <div className="space-y-2">
              {customExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50"
                >
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{exercise.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {exercise.area} • {exercise.equipment}
                    </div>
                  </div>
                  {showDeleteConfirm === exercise.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 rounded bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(exercise.id)}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Chat History Section */}
        <section className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Chat History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Clear your conversation history with the Claude assistant.
          </p>
          <Button variant="ghost" onClick={handleClearChat} className="w-full">
            Clear Chat History
          </Button>
        </section>

        {/* App Info */}
        <section className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">About</h2>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-slate-700 dark:text-slate-300">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="text-slate-700 dark:text-slate-300">localStorage</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
