import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

// ──────────────────────────────────────────────────────────────────────
// LoginStreak — localStorage-backed daily visit counter. No DB migration,
// no API calls, no backend state. We bump the counter on mount exactly
// once per calendar day.
//
// Rules:
//   - Visit today already counted → render current streak as-is.
//   - Last visit was yesterday → increment streak, mark today.
//   - Last visit was ≥ 2 calendar days ago → reset streak to 1.
//   - No record → start at 1.
//
// Why localStorage:
//   - No schema change required (goal: ship today).
//   - Streaks are per-device which is fine for solo contractors who live
//     on one phone + one laptop. We can upgrade to a users table column
//     later without changing the UI contract.
// ──────────────────────────────────────────────────────────────────────

const KEY = 'flowboss.loginStreak.v1';

interface StreakState {
  streak: number;
  lastVisit: string; // ISO yyyy-MM-dd
  best: number;
}

function loadState(): StreakState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.streak !== 'number' || typeof parsed?.lastVisit !== 'string') return null;
    return {
      streak: parsed.streak,
      lastVisit: parsed.lastVisit,
      best: typeof parsed.best === 'number' ? parsed.best : parsed.streak,
    };
  } catch {
    return null;
  }
}

function saveState(state: StreakState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore (private browsing, quota, etc.)
  }
}

function computeNext(prev: StreakState | null, today: Date): StreakState {
  const todayStr = format(today, 'yyyy-MM-dd');
  if (!prev) {
    return { streak: 1, lastVisit: todayStr, best: 1 };
  }
  if (prev.lastVisit === todayStr) {
    return prev;
  }
  let last: Date | null = null;
  try {
    last = parseISO(prev.lastVisit);
  } catch {
    last = null;
  }
  const diff = last ? differenceInCalendarDays(today, last) : 999;
  if (diff === 1) {
    const streak = prev.streak + 1;
    return { streak, lastVisit: todayStr, best: Math.max(prev.best, streak) };
  }
  // gap of 2+ days — reset
  return { streak: 1, lastVisit: todayStr, best: prev.best };
}

export function LoginStreak() {
  const [state, setState] = useState<StreakState | null>(null);

  useEffect(() => {
    const prev = loadState();
    const next = computeNext(prev, new Date());
    if (!prev || next.lastVisit !== prev.lastVisit || next.streak !== prev.streak || next.best !== prev.best) {
      saveState(next);
    }
    setState(next);
  }, []);

  if (!state) return null;

  const flameTone =
    state.streak >= 14
      ? 'text-orange-500'
      : state.streak >= 7
      ? 'text-amber-500'
      : state.streak >= 3
      ? 'text-yellow-500'
      : 'text-gray-400 dark:text-gray-500';

  const label =
    state.streak === 1
      ? 'Day 1 — welcome back'
      : state.streak < 7
      ? `${state.streak} days in a row`
      : state.streak < 30
      ? `🔥 ${state.streak}-day streak`
      : `🔥🔥 ${state.streak}-day streak`;

  const sub =
    state.best > state.streak
      ? `Best: ${state.best} days`
      : state.streak >= 3
      ? 'Keep it going'
      : 'Come back tomorrow to build a streak';

  return (
    <div className="h-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:backdrop-blur-sm flex items-center gap-3">
      <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 ring-1 ring-orange-200/60 dark:ring-orange-500/20 flex items-center justify-center`}>
        <Flame className={`w-5 h-5 ${flameTone}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
          Login streak
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {sub}
        </p>
      </div>
    </div>
  );
}
