import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  getDay,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';

// ── Types & constants ───────────────────────────────────────────────
type ViewMode = 'day' | 'week' | 'month';

const STATUS_BADGE: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'Scheduled' },
  EN_ROUTE: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', dot: 'bg-amber-500', label: 'En Route' },
  IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-500/20', dot: 'bg-cyan-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

const fmtCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ── Shared subcomponents ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.SCHEDULED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-64" />
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-32 mt-3" />
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { value: ViewMode; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === o.value
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
export function SchedulePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [view, setView] = useState<ViewMode>('day');
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Compute query params based on view
  const queryParams = useMemo(() => {
    if (view === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      return { range: 'week' as const, date: format(weekStart, 'yyyy-MM-dd') };
    }
    if (view === 'month') {
      const monthStart = startOfMonth(selectedDate);
      return { range: 'month' as const, date: format(monthStart, 'yyyy-MM-dd') };
    }
    return { range: 'today' as const, date: format(selectedDate, 'yyyy-MM-dd') };
  }, [view, selectedDate]);

  const { data: rawJobs, isLoading } = useQuery({
    queryKey: ['jobs', queryParams.range, queryParams.date],
    queryFn: () => api.getTodaysJobs(undefined, queryParams.range, queryParams.date),
  });

  const jobs = rawJobs?.data || rawJobs || [];
  const jobList: any[] = Array.isArray(jobs) ? jobs : [];

  // ── Navigation handlers ────────────────────────────────────────
  const goPrev = () => {
    if (view === 'day') setSelectedDate((d) => subDays(d, 1));
    else if (view === 'week') setSelectedDate((d) => subWeeks(d, 1));
    else setSelectedDate((d) => subMonths(d, 1));
  };
  const goNext = () => {
    if (view === 'day') setSelectedDate((d) => addDays(d, 1));
    else if (view === 'week') setSelectedDate((d) => addWeeks(d, 1));
    else setSelectedDate((d) => addMonths(d, 1));
  };
  const goToday = () => setSelectedDate(startOfDay(new Date()));
  const todaySelected = isToday(selectedDate);

  const formatTime = (iso: string | undefined) => {
    if (!iso) return '';
    return format(new Date(iso), 'h:mm a');
  };

  // ── Earnings for day view ──────────────────────────────────────
  const dayEarnings = useMemo(() => {
    if (view !== 'day') return null;
    const completedToday = jobList.filter(
      (j: any) => j.status === 'COMPLETED' || j.status === 'completed'
    );
    const total = completedToday.reduce((sum: number, j: any) => {
      const lineItems = j.lineItems || j.line_items || [];
      return (
        sum +
        lineItems.reduce(
          (s: number, li: any) => s + (Number(li.total) || Number(li.amount) || 0),
          0
        )
      );
    }, 0);
    return { total, count: jobList.length };
  }, [jobList, view]);

  // ── Header label ───────────────────────────────────────────────
  const headerLabel = useMemo(() => {
    if (view === 'day') {
      return todaySelected ? 'Today' : format(selectedDate, 'EEEE');
    }
    if (view === 'week') {
      const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const we = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'MMMM yyyy');
  }, [view, selectedDate, todaySelected]);

  const subLabel = view === 'day' ? format(selectedDate, 'EEEE, MMMM d') : '';

  // ── View-specific handlers ─────────────────────────────────────
  const switchToDay = (date: Date) => {
    setSelectedDate(startOfDay(date));
    setView('day');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto relative min-h-full">
      {/* View toggle + header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {headerLabel}
            {subLabel && (
              <>
                <span className="text-neutral-400 font-normal"> &mdash; </span>
                <span className="font-semibold text-neutral-700">{subLabel}</span>
              </>
            )}
          </h1>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Earnings summary (day view only) */}
      {view === 'day' && dayEarnings && !isLoading && (
        <div className="mb-6 flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-700">
              Today&apos;s Earnings: {fmtCurrency.format(dayEarnings.total)}
            </p>
            <p className="text-sm text-green-600">
              {dayEarnings.count} job{dayEarnings.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Navigator */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={goPrev}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-neutral-700">
          <CalendarDays className="w-4 h-4 text-neutral-400" />
          {view === 'day' && format(selectedDate, 'MMM d, yyyy')}
          {view === 'week' && (() => {
            const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const we = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(ws, 'MMM d')} - ${format(we, 'MMM d')}`;
          })()}
          {view === 'month' && format(selectedDate, 'MMMM yyyy')}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5 text-neutral-500" />
        </button>

        {!todaySelected && (
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Today
          </button>
        )}

        {view === 'day' && (
          <div className="ml-auto text-sm text-neutral-400">
            {jobList.length} job{jobList.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── DAY VIEW ──────────────────────────────────────────── */}
      {view === 'day' && (
        <DayView
          jobs={jobList}
          isLoading={isLoading}
          navigate={navigate}
          formatTime={formatTime}
        />
      )}

      {/* ── WEEK VIEW ─────────────────────────────────────────── */}
      {view === 'week' && (
        <WeekView
          jobs={jobList}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onDayClick={switchToDay}
          navigate={navigate}
          formatTime={formatTime}
        />
      )}

      {/* ── MONTH VIEW ────────────────────────────────────────── */}
      {view === 'month' && (
        <MonthView
          jobs={jobList}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onDayClick={switchToDay}
        />
      )}

      {/* Quick-add floating button */}
      <button
        type="button"
        onClick={() => setShowCreateJob(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-20"
        aria-label="Add new job"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateJobModal
        open={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}

// ── Day View (original) ────────────────────────────────────────────
function DayView({
  jobs,
  isLoading,
  navigate,
  formatTime,
}: {
  jobs: any[];
  isLoading: boolean;
  navigate: (path: string) => void;
  formatTime: (iso: string | undefined) => string;
}) {
  return (
    <div className="space-y-3">
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-neutral-300 mb-4" />
          <p className="text-lg font-medium text-neutral-500">
            No jobs scheduled for this day
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            Select a different date or create a new job.
          </p>
        </div>
      ) : (
        jobs.map((job: any) => {
          const customerName =
            [job.customer?.firstName, job.customer?.lastName]
              .filter(Boolean)
              .join(' ') || 'Unknown Customer';
          const timeRange =
            job.scheduledStart || job.scheduled_start
              ? `${formatTime(job.scheduledStart || job.scheduled_start)}${
                  job.scheduledEnd || job.scheduled_end
                    ? ` - ${formatTime(job.scheduledEnd || job.scheduled_end)}`
                    : ''
                }`
              : '';
          const address =
            job.property?.street ||
            job.property?.address ||
            job.property?.city ||
            '';

          return (
            <button
              key={job.id}
              type="button"
              onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 hover:border-brand-200 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                    {customerName}
                  </p>
                  {job.description && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                      {job.description}
                    </p>
                  )}
                </div>
                <StatusBadge status={job.status} />
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                {timeRange && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {timeRange}
                  </span>
                )}
                {address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{address}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

// ── Week View ──────────────────────────────────────────────────────
function WeekView({
  jobs,
  isLoading,
  selectedDate,
  onDayClick,
  navigate,
  formatTime,
}: {
  jobs: any[];
  isLoading: boolean;
  selectedDate: Date;
  onDayClick: (d: Date) => void;
  navigate: (path: string) => void;
  formatTime: (iso: string | undefined) => string;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  const jobsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const day of days) {
      map.set(format(day, 'yyyy-MM-dd'), []);
    }
    for (const job of jobs) {
      const start = job.scheduledStart || job.scheduled_start;
      if (!start) continue;
      const key = format(new Date(start), 'yyyy-MM-dd');
      if (map.has(key)) {
        map.get(key)!.push(job);
      }
    }
    return map;
  }, [jobs, days]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayJobs = jobsByDay.get(key) || [];
        const today = isToday(day);

        return (
          <div key={key} className="min-w-0">
            {/* Day header */}
            <button
              type="button"
              onClick={() => onDayClick(day)}
              className={`w-full text-center py-2 rounded-lg text-sm font-medium mb-2 transition-colors ${
                today
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs opacity-75">{format(day, 'EEE')}</div>
              <div>{format(day, 'd')}</div>
            </button>

            {/* Job cards */}
            <div className="space-y-1.5">
              {dayJobs.length === 0 ? (
                <div className="text-[10px] text-neutral-300 text-center py-3">
                  No jobs
                </div>
              ) : (
                dayJobs.map((job: any) => {
                  const customerName =
                    [job.customer?.firstName, job.customer?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Unknown';
                  const time = formatTime(job.scheduledStart || job.scheduled_start);
                  const statusCfg = STATUS_BADGE[job.status] || STATUS_BADGE.SCHEDULED;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                      className={`w-full text-left rounded-lg border p-2 text-xs hover:shadow-sm transition-all ${statusCfg.bg} border-gray-200`}
                    >
                      <p className="font-medium text-neutral-800 truncate">
                        {customerName}
                      </p>
                      {time && (
                        <p className="text-neutral-500 mt-0.5 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {time}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Month View ─────────────────────────────────────────────────────
function MonthView({
  jobs,
  isLoading,
  selectedDate,
  onDayClick,
}: {
  jobs: any[];
  isLoading: boolean;
  selectedDate: Date;
  onDayClick: (d: Date) => void;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Build calendar grid: start from monday of the week containing monthStart
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const jobCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of jobs) {
      const start = job.scheduledStart || job.scheduled_start;
      if (!start) continue;
      const key = format(new Date(start), 'yyyy-MM-dd');
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [jobs]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const count = jobCountByDay.get(key) || 0;
          const today = isToday(day);
          const inMonth = isSameMonth(day, selectedDate);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={`relative flex flex-col items-center justify-center h-16 rounded-lg border transition-all ${
                today
                  ? 'ring-2 ring-brand-500 border-brand-200 bg-brand-50'
                  : inMonth
                  ? 'border-gray-200 bg-white hover:bg-gray-50 hover:border-brand-200'
                  : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  today
                    ? 'text-brand-600'
                    : inMonth
                    ? 'text-neutral-700'
                    : 'text-neutral-300'
                }`}
              >
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span
                  className={`mt-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                    today
                      ? 'bg-brand-500 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
