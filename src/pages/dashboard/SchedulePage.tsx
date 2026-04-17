import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { JOB_STATUS_BADGE } from '../../lib/constants';
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
  isBefore,
  getDay,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  DollarSign,
  HardHat,
} from 'lucide-react';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SpotlightTip } from '../../components/ui/SpotlightTip';

// ── Types & constants ───────────────────────────────────────────────
type ViewMode = 'day' | 'week' | 'month';

const STATUS_BADGE = JOB_STATUS_BADGE;

const fmtCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TRADE_ACCENT: Record<string, string> = {
  Plumbing: '#3b82f6',
  Electrical: '#eab308',
  HVAC: '#06b6d4',
  Framing: '#f97316',
  Drywall: '#a8a29e',
  Painting: '#a855f7',
  Roofing: '#ef4444',
  Concrete: '#6b7280',
  Flooring: '#f59e0b',
  Landscaping: '#22c55e',
};

interface GcTradeEvent {
  tradeId: string;
  tradeName: string;
  projectName: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  totalTasks: number;
  doneTasks: number;
  accentColor: string;
}

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
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-40 dark:bg-white/10" />
          <div className="h-3 bg-gray-100 rounded w-64 dark:bg-white/10" />
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-20 dark:bg-white/10" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-32 mt-3 dark:bg-white/10" />
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
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-white/10 dark:bg-white/[0.02]">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === o.value
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          } dark:text-blue-300`}
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

  // ── GC invited projects (single query, view-independent) ──────
  const { data: invitedRaw } = useQuery({
    queryKey: ['invited-projects'],
    queryFn: () => api.getInvitedProjects(),
  });

  const gcTradeEvents: GcTradeEvent[] = useMemo(() => {
    const projects: any[] = invitedRaw?.data || [];
    const events: GcTradeEvent[] = [];
    for (const project of projects) {
      for (const trade of project.trades || []) {
        if (!trade.startDate && !trade.endDate) continue;
        const totalTasks = (trade.tasks || []).length;
        const doneTasks = (trade.tasks || []).filter((t: any) => t.done).length;
        events.push({
          tradeId: trade.id,
          tradeName: trade.trade || 'Unknown Trade',
          projectName: project.name || 'Untitled Project',
          projectId: project.id,
          startDate: trade.startDate ? parseISO(trade.startDate) : parseISO(trade.endDate),
          endDate: trade.endDate ? parseISO(trade.endDate) : parseISO(trade.startDate),
          totalTasks,
          doneTasks,
          accentColor: TRADE_ACCENT[trade.trade] || '#6b7280',
        });
      }
    }
    return events;
  }, [invitedRaw]);

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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {headerLabel}
            {subLabel && (
              <>
                <span className="text-neutral-400 font-normal dark:text-gray-500"> &mdash; </span>
                <span className="font-semibold text-neutral-700 dark:text-gray-200">{subLabel}</span>
              </>
            )}
          </h1>
        </div>
        <SpotlightTip
          tipId="schedule-view-toggle"
          title="Switch your view"
          message="Day view shows your lineup. Week and month views help you plan ahead and spot gaps."
          position="bottom"
        >
          <ViewToggle view={view} onChange={setView} />
        </SpotlightTip>
      </div>

      {/* Earnings summary (day view only) */}
      {view === 'day' && dayEarnings && !isLoading && (
        <div className="mb-6 flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-3 dark:bg-green-500/10 dark:border-green-500/30">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg dark:bg-green-500/20">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {todaySelected ? "Today's" : `${headerLabel}'s`} Earnings: {fmtCurrency.format(dayEarnings.total)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
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
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors dark:border-white/10 dark:hover:bg-white/10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-500 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-neutral-700 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10 dark:text-gray-200">
          <CalendarDays className="w-4 h-4 text-neutral-400 dark:text-gray-500" />
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
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors dark:border-white/10 dark:hover:bg-white/10"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5 text-neutral-500 dark:text-gray-400" />
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
          <div className="ml-auto text-sm text-neutral-400 dark:text-gray-500">
            {jobList.length} job{jobList.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── DAY VIEW ──────────────────────────────────────────── */}
      {view === 'day' && (
        <DayView
          jobs={jobList}
          gcEvents={gcTradeEvents}
          selectedDate={selectedDate}
          isLoading={isLoading}
          navigate={navigate}
          formatTime={formatTime}
        />
      )}

      {/* ── WEEK VIEW ─────────────────────────────────────────── */}
      {view === 'week' && (
        <WeekView
          jobs={jobList}
          gcEvents={gcTradeEvents}
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
          gcEvents={gcTradeEvents}
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
  gcEvents,
  selectedDate,
  isLoading,
  navigate,
  formatTime,
}: {
  jobs: any[];
  gcEvents: GcTradeEvent[];
  selectedDate: Date;
  isLoading: boolean;
  navigate: (path: string) => void;
  formatTime: (iso: string | undefined) => string;
}) {
  const dayGcEvents = useMemo(
    () =>
      gcEvents.filter((e) => {
        try {
          return isWithinInterval(selectedDate, { start: startOfDay(e.startDate), end: startOfDay(e.endDate) });
        } catch {
          return isSameDay(selectedDate, e.startDate) || isSameDay(selectedDate, e.endDate);
        }
      }),
    [gcEvents, selectedDate]
  );

  const isEmpty = jobs.length === 0 && dayGcEvents.length === 0;

  return (
    <div className="space-y-3">
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : isEmpty ? (
        <EmptyState
          icon={CalendarDays}
          title="Your schedule is wide open"
          description="Once you create jobs with scheduled dates, they'll show up here. You can view by day, week, or month."
          actionLabel="Create a Job"
          actionHref="/dashboard/jobs"
          accentColor="cyan"
        />
      ) : (
        <>
          {jobs.map((job: any) => {
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
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 hover:border-brand-200 transition-all duration-200 group dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors dark:text-white">
                      {customerName}
                    </p>
                    {job.description && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-1 dark:text-gray-400">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-gray-500">
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
          })}

          {/* GC Projects section */}
          {dayGcEvents.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-4 pb-1">
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 dark:text-gray-500">
                  <HardHat className="w-3.5 h-3.5" />
                  GC Projects
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>
              {dayGcEvents.map((evt) => (
                <button
                  key={evt.tradeId}
                  type="button"
                  onClick={() => navigate(`/dashboard/projects/${evt.projectId}`)}
                  className="w-full text-left bg-brand-50 rounded-xl border border-gray-200 border-l-4 border-l-brand-400 p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 group dark:bg-blue-500/10 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-brand-500 flex-shrink-0 dark:text-blue-300" />
                        <p className="text-base font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors dark:text-white">
                          {evt.tradeName}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1 dark:text-gray-400">{evt.projectName}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 ring-1 ring-inset ring-brand-500/20 dark:bg-blue-500/20 dark:text-blue-300">
                      {evt.doneTasks}/{evt.totalTasks} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {format(evt.startDate, 'MMM d')} - {format(evt.endDate, 'MMM d')}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: evt.accentColor }}
                    />
                  </div>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Week View ──────────────────────────────────────────────────────
function WeekView({
  jobs,
  gcEvents,
  isLoading,
  selectedDate,
  onDayClick,
  navigate,
  formatTime,
}: {
  jobs: any[];
  gcEvents: GcTradeEvent[];
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

  const gcEventsByDay = useMemo(() => {
    const map = new Map<string, GcTradeEvent[]>();
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);
      const matching = gcEvents.filter((e) => {
        try {
          return isWithinInterval(dayStart, { start: startOfDay(e.startDate), end: startOfDay(e.endDate) });
        } catch {
          return isSameDay(day, e.startDate) || isSameDay(day, e.endDate);
        }
      });
      map.set(key, matching);
    }
    return map;
  }, [gcEvents, days]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse dark:bg-white/10" />
            <div className="h-20 bg-gray-100 rounded animate-pulse dark:bg-white/10" />
            <div className="h-20 bg-gray-100 rounded animate-pulse dark:bg-white/10" />
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
        const past = isBefore(startOfDay(day), startOfDay(new Date()));
        const weekend = isWeekend(day);

        return (
          <div key={key} className={`min-w-0 ${past && !today ? 'opacity-75' : ''}`}>
            {/* Day header */}
            <button
              type="button"
              onClick={() => onDayClick(day)}
              className={`w-full text-center py-2 rounded-lg text-sm font-medium mb-2 transition-colors ${
                today
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
              } dark:text-gray-300`}
            >
              <div className="text-xs opacity-75">{format(day, 'EEE')}</div>
              <div>{format(day, 'd')}</div>
            </button>

            {/* Job cards */}
            <div className={`space-y-1.5 ${weekend ? 'rounded-lg bg-gray-50/50 p-0.5' : ''}`}>
              {dayJobs.length === 0 && (gcEventsByDay.get(key) || []).length === 0 ? (
                <div className="py-3" />
              ) : (
                <>
                  {dayJobs.map((job: any) => {
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
                        className={`w-full text-left rounded-lg border p-2 text-xs hover:shadow-sm transition-all ${statusCfg.bg} border-gray-200 dark:border-white/10`}
                      >
                        <p className="font-medium text-neutral-800 truncate dark:text-gray-100">
                          {customerName}
                        </p>
                        {time && (
                          <p className="text-neutral-500 mt-0.5 flex items-center gap-0.5 dark:text-gray-400">
                            <Clock className="w-2.5 h-2.5" />
                            {time}
                          </p>
                        )}
                      </button>
                    );
                  })}
                  {/* GC trade blocks */}
                  {(gcEventsByDay.get(key) || []).map((evt) => (
                    <button
                      key={`gc-${evt.tradeId}`}
                      type="button"
                      onClick={() => navigate(`/dashboard/projects/${evt.projectId}`)}
                      className="w-full text-left rounded-lg border border-gray-200 border-l-4 border-l-brand-400 bg-brand-50 p-2 text-xs hover:shadow-sm transition-all dark:border-white/10 dark:bg-blue-500/10"
                    >
                      <p className="font-medium text-neutral-800 truncate flex items-center gap-1 dark:text-gray-100">
                        <HardHat className="w-2.5 h-2.5 text-brand-500 flex-shrink-0 dark:text-blue-300" />
                        {evt.tradeName}
                      </p>
                      <p className="text-neutral-500 mt-0.5 truncate dark:text-gray-400">{evt.projectName}</p>
                      <p className="text-brand-600 mt-0.5 font-medium dark:text-blue-300">{evt.doneTasks}/{evt.totalTasks} tasks</p>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Helper: status → dot color ─────────────────────────────────────
function jobDotColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
    case 'scheduled':
      return 'bg-blue-500';
    case 'IN_PROGRESS':
    case 'in_progress':
    case 'EN_ROUTE':
    case 'en_route':
      return 'bg-cyan-500';
    case 'COMPLETED':
    case 'completed':
      return 'bg-green-500';
    case 'BLOCKED':
    case 'blocked':
    case 'OVERDUE':
    case 'overdue':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
}

// ── Helper: heat-map bg class based on total item count ────────────
function heatBg(totalItems: number): string {
  if (totalItems >= 5) return 'bg-blue-200';
  if (totalItems >= 3) return 'bg-blue-100';
  if (totalItems >= 1) return 'bg-blue-50';
  return '';
}

// ── Helper: is weekend (Sat=6, Sun=0) ──────────────────────────────
function isWeekend(day: Date): boolean {
  const d = getDay(day);
  return d === 0 || d === 6;
}

// ── Month View ─────────────────────────────────────────────────────
function MonthView({
  jobs,
  gcEvents,
  isLoading,
  selectedDate,
  onDayClick,
}: {
  jobs: any[];
  gcEvents: GcTradeEvent[];
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

  const jobsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const job of jobs) {
      const start = job.scheduledStart || job.scheduled_start;
      if (!start) continue;
      const key = format(new Date(start), 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(job);
      map.set(key, arr);
    }
    return map;
  }, [jobs]);

  const gcEventsByDay = useMemo(() => {
    const map = new Map<string, GcTradeEvent[]>();
    for (const day of allDays) {
      const key = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);
      const matching = gcEvents.filter((e) => {
        try {
          return isWithinInterval(dayStart, { start: startOfDay(e.startDate), end: startOfDay(e.endDate) });
        } catch {
          return isSameDay(day, e.startDate) || isSameDay(day, e.endDate);
        }
      });
      if (matching.length > 0) map.set(key, matching);
    }
    return map;
  }, [gcEvents, allDays]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1 dark:text-gray-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse dark:bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i >= 5 ? 'text-neutral-300' : 'text-neutral-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayJobs = jobsByDay.get(key) || [];
          const dayGcEvents = gcEventsByDay.get(key) || [];
          const totalItems = dayJobs.length + dayGcEvents.length;
          const today = isToday(day);
          const inMonth = isSameMonth(day, selectedDate);
          const weekend = isWeekend(day);
          const MAX_DOTS = 5;
          const overflow = totalItems > MAX_DOTS ? totalItems - MAX_DOTS : 0;

          // Build base bg: heat map for in-month days, muted for out-of-month
          let baseBg: string;
          if (!inMonth) {
            baseBg = 'bg-gray-50/50';
          } else if (totalItems > 0) {
            baseBg = heatBg(totalItems);
          } else if (weekend) {
            baseBg = 'bg-gray-50/50';
          } else {
            baseBg = 'bg-white';
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={`relative flex flex-col items-center justify-start pt-1.5 h-20 rounded-lg border transition-all ${
                today
                  ? `ring-2 ring-brand-500 border-brand-200 ${totalItems > 0 ? heatBg(totalItems) : 'bg-brand-50'}`
                  : inMonth
                  ? `border-gray-200 ${baseBg} hover:border-brand-200`
                  : `border-gray-100 ${baseBg}`
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  today
                    ? 'text-brand-600 font-bold'
                    : inMonth
                    ? 'text-neutral-700'
                    : 'text-neutral-300'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Job status dots + GC diamond dots */}
              {totalItems > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-[3px] mt-1 px-1 max-w-full">
                  {dayJobs.slice(0, MAX_DOTS).map((job: any, i: number) => (
                    <span
                      key={job.id || i}
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${jobDotColor(job.status)}`}
                      title={job.description || job.customer?.firstName || 'Job'}
                    />
                  ))}
                  {dayJobs.length < MAX_DOTS &&
                    dayGcEvents.slice(0, MAX_DOTS - dayJobs.length).map((evt) => (
                      <span
                        key={evt.tradeId}
                        className="w-2 h-2 rotate-45 flex-shrink-0 rounded-[1px]"
                        style={{ backgroundColor: evt.accentColor }}
                        title={`${evt.tradeName} - ${evt.projectName}`}
                      />
                    ))}
                  {overflow > 0 && (
                    <span className="text-[8px] text-gray-500 font-bold leading-none dark:text-gray-400">
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
