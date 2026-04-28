/**
 * Persistent Job Timer (web) — parity with apps/mobile/lib/jobTimer.ts.
 *
 * Same shape, same API surface, same persistence semantics. The only
 * substantive difference is storage: mobile uses AsyncStorage, web uses
 * localStorage. The TimerEntry record is otherwise identical so callers
 * can read/write timers from either surface and get the same answer.
 *
 * State lives outside React so timers survive route navigation and tab
 * focus changes within a single browser session. (Cross-device sync was
 * intentionally not built — a tradesperson tracking time on the truck
 * vs at the office on web are usually distinct sessions; we don't want
 * the desktop side hijacking a mobile timer mid-job.)
 */

const STORAGE_KEY = 'flowboss_job_timers';

export interface TimerEntry {
  jobId: string;
  startTime: string | null; // ISO string when running, null when paused
  elapsed: number;          // accumulated seconds (not counting current run)
  isRunning: boolean;
}

// In-memory cache so reads after the first don't go through localStorage.
let cache: Record<string, TimerEntry> | null = null;

function loadCache(): Record<string, TimerEntry> {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    cache = {};
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, TimerEntry>) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function persistCache(): void {
  if (!cache || typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota errors / private mode — silent fail, timer is best-effort UI.
  }
}

export function startTimer(jobId: string): void {
  const timers = loadCache();
  const existing = timers[jobId];
  timers[jobId] = {
    jobId,
    startTime: new Date().toISOString(),
    elapsed: existing?.elapsed ?? 0,
    isRunning: true,
  };
  persistCache();
}

export function stopTimer(jobId: string): void {
  const timers = loadCache();
  const entry = timers[jobId];
  if (!entry) return;
  timers[jobId] = {
    ...entry,
    elapsed: getElapsedSync(entry),
    startTime: null,
    isRunning: false,
  };
  persistCache();
}

export function getTimer(jobId: string): TimerEntry | null {
  const timers = loadCache();
  return timers[jobId] ?? null;
}

/** Total elapsed seconds — accumulated plus the current run if running. */
export function getElapsedSync(entry: TimerEntry): number {
  if (!entry.isRunning || !entry.startTime) return Math.floor(entry.elapsed);
  const runningSeconds = (Date.now() - new Date(entry.startTime).getTime()) / 1000;
  return Math.floor(entry.elapsed + runningSeconds);
}

export function clearTimer(jobId: string): void {
  const timers = loadCache();
  delete timers[jobId];
  persistCache();
}

/** Auto-start helper for status transitions (mirrors mobile). */
export function resetAndStart(jobId: string): void {
  const timers = loadCache();
  timers[jobId] = {
    jobId,
    startTime: new Date().toISOString(),
    elapsed: 0,
    isRunning: true,
  };
  persistCache();
}

/** HH:MM:SS for display. */
export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
