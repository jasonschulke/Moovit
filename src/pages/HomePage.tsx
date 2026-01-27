import { useEffect, useState, useMemo, useCallback } from 'react';
import { getWorkoutStats, getThisWeekWorkoutDates, getYearlyContributions, loadRestDays, toggleYearDayStatus, hasWorkoutOnDate, hasRealWorkoutOnDate, addBacklogWorkout, getEffortHistory } from '../data/storage';
import { EffortChart } from '../components/EffortChart';

export function HomePage() {
  const [stats, setStats] = useState(() => getWorkoutStats());
  const [thisWeekDates, setThisWeekDates] = useState(() => getThisWeekWorkoutDates());
  const [yearlyData, setYearlyData] = useState(() => getYearlyContributions());
  const [restDays, setRestDays] = useState(() => loadRestDays());
  const [effortHistory, setEffortHistory] = useState(() => getEffortHistory());

  useEffect(() => {
    // Add backlog workouts for specified dates (only if not already present)
    const backlogDates = ['2026-01-06', '2026-01-07', '2026-01-20', '2026-01-21', '2026-01-23', '2026-01-24'];
    backlogDates.forEach(dateStr => {
      if (!hasWorkoutOnDate(dateStr)) {
        addBacklogWorkout(dateStr);
      }
    });

    setStats(getWorkoutStats());
    setThisWeekDates(getThisWeekWorkoutDates());
    setYearlyData(getYearlyContributions());
    setRestDays(loadRestDays());
    setEffortHistory(getEffortHistory());
  }, []);

  const handleToggleYearDay = useCallback((dateStr: string) => {
    // Optimistic update for instant feedback
    const hasWorkout = (yearlyData.get(dateStr) || 0) > 0;
    const isRest = restDays.has(dateStr);

    // Predict next state: none -> workout -> rest -> none
    if (!hasWorkout && !isRest) {
      // none -> workout
      setYearlyData(prev => new Map(prev).set(dateStr, 1));
    } else if (hasWorkout && !isRest) {
      // workout -> rest
      setYearlyData(prev => {
        const next = new Map(prev);
        next.delete(dateStr);
        return next;
      });
      setRestDays(prev => new Set(prev).add(dateStr));
    } else {
      // rest -> none
      setRestDays(prev => {
        const next = new Set(prev);
        next.delete(dateStr);
        return next;
      });
    }

    // Perform actual storage update
    toggleYearDayStatus(dateStr);

    // Refresh stats and week dates (these are derived and need recalculation)
    setStats(getWorkoutStats());
    setThisWeekDates(getThisWeekWorkoutDates());
  }, [yearlyData, restDays]);

  // Week starts on Monday
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  // Get dates for this week (Monday to Sunday)
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const currentDay = today.getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Year contribution grid starting from Jan 1, 2026
  const { contributionGrid, monthLabels } = useMemo(() => {
    const startDate = new Date(2026, 0, 1); // Jan 1, 2026
    const endDate = new Date(2026, 11, 31); // Dec 31, 2026
    const weeks: { date: string; hasWorkout: boolean; isRest: boolean }[][] = [];
    let currentWeek: { date: string; hasWorkout: boolean; isRest: boolean }[] = [];
    const labels: { weekIndex: number; label: string }[] = [];

    // Start from the Monday of the week containing Jan 1
    const firstDay = startDate.getDay();
    const mondayOffset = firstDay === 0 ? -6 : 1 - firstDay;
    const gridStart = new Date(startDate);
    gridStart.setDate(startDate.getDate() + mondayOffset);

    let currentMonth = -1;
    let currentDate = new Date(gridStart);

    while (currentDate <= endDate || currentWeek.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isInYear = currentDate >= startDate && currentDate <= endDate;
      const month = currentDate.getMonth();

      // Track month changes for labels
      if (isInYear && month !== currentMonth && currentWeek.length === 0) {
        labels.push({
          weekIndex: weeks.length,
          label: currentDate.toLocaleString('default', { month: 'short' }),
        });
        currentMonth = month;
      }

      currentWeek.push({
        date: isInYear ? dateStr : '',
        hasWorkout: isInYear ? (yearlyData.get(dateStr) || 0) > 0 : false,
        isRest: isInYear ? restDays.has(dateStr) : false,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Stop after completing the year
      if (currentDate > endDate && currentWeek.length === 0) break;
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', hasWorkout: false, isRest: false });
      }
      weeks.push(currentWeek);
    }

    return { contributionGrid: weeks, monthLabels: labels };
  }, [yearlyData, restDays]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Find favorite workout day
  const favoriteDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxDay = Object.entries(stats.workoutsByDay).reduce(
      (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
      { day: -1, count: 0 }
    );
    return maxDay.count > 0 ? days[maxDay.day] : '--';
  }, [stats.workoutsByDay]);

  return (
    <div className="min-h-screen pb-24 bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 pt-16 pb-4 safe-top">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Workout
        </h1>
      </header>

      {/* Streak Banner */}
      {stats.currentStreak > 0 && (
        <section className="px-4 mb-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-100 to-emerald-100 dark:from-amber-600/20 dark:to-emerald-600/20 border border-amber-300 dark:border-amber-600/30">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.currentStreak} day streak</span>
              {stats.longestStreak > stats.currentStreak && (
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  (best: {stats.longestStreak})
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Activity with Checkmarks */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">This Week</h2>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between gap-1">
            {dayNames.map((day, i) => {
              const date = weekDates[i];
              const dateStr = date.toISOString().split('T')[0];
              const hasWorkout = thisWeekDates.has(date.toDateString());
              const isRest = restDays.has(dateStr);
              const isToday = date.toDateString() === today.toDateString();
              const isFuture = date > today;
              const isRealWorkout = hasRealWorkoutOnDate(dateStr);
              // Can toggle unless it's a future date or a real workout
              const canToggle = !isFuture && !isRealWorkout;

              return (
                <div key={day} className="flex-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (canToggle) handleToggleYearDay(dateStr);
                    }}
                    disabled={!canToggle}
                    className={`h-11 w-11 mx-auto rounded-full mb-1 flex items-center justify-center transition-all touch-manipulation ${
                      hasWorkout
                        ? isRealWorkout
                          ? 'bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-700'
                          : 'bg-emerald-500 hover:bg-emerald-400'
                        : isRest
                        ? 'bg-purple-400 hover:bg-purple-300 dark:bg-purple-500 dark:hover:bg-purple-400'
                        : isToday
                        ? 'border-2 border-dashed border-emerald-500 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                        : isFuture
                        ? 'bg-slate-100 dark:bg-slate-700/50'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                    } ${canToggle ? 'cursor-pointer active:scale-95' : ''}`}
                    title={isRealWorkout ? 'Completed workout - cannot modify' : 'Tap to toggle status'}
                  >
                    {hasWorkout && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isRest && !hasWorkout && (
                      <span className="text-white text-xs font-medium">R</span>
                    )}
                  </button>
                  <div className={`text-xs font-medium ${
                    isToday
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {day}
                  </div>
                  <div className={`text-[10px] ${
                    isToday
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Workout</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-400 dark:bg-purple-500" />
              <span>Rest</span>
            </div>
            <span className="text-[9px]">Tap to toggle</span>
          </div>
        </div>
      </section>

      {/* Yearly Contribution Grid */}
      <section className="px-4 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">2026</h2>
          <span className="text-xs text-slate-500">Year Overview</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto scrollbar-hide">
          <div className="min-w-max">
            {/* Month labels row */}
            <div className="flex gap-[3px] mb-2 h-4">
              {contributionGrid.map((_, weekIndex) => {
                const label = monthLabels.find(m => m.weekIndex === weekIndex);
                return (
                  <div key={weekIndex} className="w-[11px] flex-shrink-0">
                    {label && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {label.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Grid */}
            <div className="flex gap-[3px]">
              {contributionGrid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <button
                      type="button"
                      key={`${weekIndex}-${dayIndex}`}
                      onClick={() => day.date && handleToggleYearDay(day.date)}
                      disabled={!day.date}
                      className={`w-[11px] h-[11px] rounded-[2px] transition-colors touch-manipulation ${
                        !day.date
                          ? 'bg-transparent cursor-default'
                          : day.hasWorkout
                          ? 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer'
                          : day.isRest
                          ? 'bg-purple-400 hover:bg-purple-300 dark:bg-purple-500 dark:hover:bg-purple-400 cursor-pointer'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer'
                      }`}
                      title={day.date ? `${day.date}: ${day.hasWorkout ? 'Worked out' : day.isRest ? 'Rest day' : 'No workout'} (tap to change)` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-slate-500">
            <div className="w-[11px] h-[11px] rounded-[2px] bg-slate-200 dark:bg-slate-700" />
            <span>None</span>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500 ml-2" />
            <span>Workout</span>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-purple-400 dark:bg-purple-500 ml-2" />
            <span>Rest</span>
          </div>
        </div>
      </section>

      {/* Effort Chart */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Effort Trend</h2>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <EffortChart data={effortHistory} />
        </div>
      </section>

      {/* Quick Stats - 2 rows */}
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.thisWeek}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">This week</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.thisMonth}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">This month</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalWorkouts}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '--'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Avg time</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.longestStreak}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Best streak</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{favoriteDay}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Top day</div>
          </div>
        </div>
      </section>
    </div>
  );
}
