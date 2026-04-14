import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { format, addMonths, subMonths, isThisMonth, startOfMonth } from 'date-fns';
import {
  Search,
  Plus,
  Briefcase,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';

const STATUS_BADGE: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'Scheduled' },
  EN_ROUTE: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', dot: 'bg-amber-500', label: 'En Route' },
  IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-500/20', dot: 'bg-cyan-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

const PRIORITY_BADGE: Record<string, string> = {
  EMERGENCY: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-gray-100 text-neutral-500',
  LOW: 'bg-blue-50 text-blue-600',
};

type FilterTab = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
type TimeRange = 'all' | 'month';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

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

function PriorityBadge({ priority }: { priority: string }) {
  const upper = (priority || 'NORMAL').toUpperCase();
  const cls = PRIORITY_BADGE[upper] || PRIORITY_BADGE.NORMAL;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {upper.charAt(0) + upper.slice(1).toLowerCase()}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-48" /></td>
      <td className="px-4 py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
    </tr>
  );
}

const ITEMS_PER_PAGE = 20;

export function JobsPage() {
  const navigate = useNavigate();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [viewMonth, setViewMonth] = useState(() => new Date());

  // Fetch all jobs when 'all', or use month-based query for month view
  const { data: rawJobs, isLoading } = useQuery({
    queryKey: ['jobs', timeRange, timeRange === 'month' ? format(viewMonth, 'yyyy-MM') : 'all'],
    queryFn: () => {
      if (timeRange === 'all') {
        return api.getTodaysJobs(undefined, 'all');
      }
      // Month range: use the first day of the selected month
      const monthStart = startOfMonth(viewMonth);
      return api.getTodaysJobs(undefined, 'month', format(monthStart, 'yyyy-MM-dd'));
    },
  });

  const allJobs: any[] = useMemo(() => {
    const jobs = rawJobs?.data || rawJobs || [];
    return Array.isArray(jobs) ? jobs : [];
  }, [rawJobs]);

  const filteredJobs = useMemo(() => {
    let result = allJobs;

    // Filter by status tab
    if (activeTab !== 'ALL') {
      result = result.filter((j: any) => j.status === activeTab);
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((j: any) => {
        const name = `${j.customer?.firstName || ''} ${j.customer?.lastName || ''}`.toLowerCase();
        const desc = (j.description || '').toLowerCase();
        const addr = (j.property?.street || j.property?.address || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || addr.includes(q);
      });
    }

    return result;
  }, [allJobs, activeTab, search]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJobs.length;

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '-';
    return format(new Date(iso), 'MMM d, yyyy');
  };

  const formatTime = (iso: string | undefined) => {
    if (!iso) return '';
    return format(new Date(iso), 'h:mm a');
  };

  // Month navigation
  const goToPrevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setViewMonth((m) => addMonths(m, 1));
  const goToCurrentMonth = () => setViewMonth(new Date());

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allJobs.length} job{allJobs.length !== 1 ? 's' : ''}{' '}
            {timeRange === 'month' ? `in ${format(viewMonth, 'MMMM yyyy')}` : 'total'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateJob(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Time range selector + month navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* All Time vs Monthly toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setTimeRange('all'); setVisibleCount(ITEMS_PER_PAGE); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeRange === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => { setTimeRange('month'); setVisibleCount(ITEMS_PER_PAGE); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeRange === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-3 h-3 inline mr-1" />
            Monthly
          </button>
        </div>

        {/* Month navigation (only visible in month mode) */}
        {timeRange === 'month' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isThisMonth(viewMonth) && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium ml-1"
              >
                Today
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by customer, description, or address..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-400"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_TABS.map(({ key, label }) => {
          const count =
            key === 'ALL'
              ? allJobs.length
              : allJobs.filter((j: any) => j.status === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs text-neutral-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100/80">
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
                Customer
              </th>
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
                Description
              </th>
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
                Scheduled Date
              </th>
              <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">
                Priority
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : visibleJobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">
                    {timeRange === 'month'
                      ? `No jobs in ${format(viewMonth, 'MMMM yyyy')}`
                      : 'No jobs found'}
                  </p>
                  {timeRange === 'month' && (
                    <button
                      type="button"
                      onClick={() => setTimeRange('all')}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2"
                    >
                      View all jobs instead
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              visibleJobs.map((job: any) => {
                const customerName =
                  [job.customer?.firstName, job.customer?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Unknown Customer';

                return (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {customerName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-neutral-500 line-clamp-1 max-w-xs">
                        {job.description || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-neutral-500">
                        {formatDate(job.scheduledStart || job.scheduled_start)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatTime(job.scheduledStart || job.scheduled_start)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <PriorityBadge priority={job.priority || 'NORMAL'} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-48 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-5 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))
        ) : visibleJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="w-10 h-10 text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500">
              {timeRange === 'month'
                ? `No jobs in ${format(viewMonth, 'MMMM yyyy')}`
                : 'No jobs found'}
            </p>
            {timeRange === 'month' && (
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2"
              >
                View all jobs instead
              </button>
            )}
          </div>
        ) : (
          visibleJobs.map((job: any) => {
            const customerName =
              [job.customer?.firstName, job.customer?.lastName]
                .filter(Boolean)
                .join(' ') || 'Unknown Customer';

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {customerName}
                    </p>
                    {job.description && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0" />
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <StatusBadge status={job.status} />
                  <PriorityBadge priority={job.priority || 'NORMAL'} />
                  {(job.scheduledStart || job.scheduled_start) && (
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledStart || job.scheduled_start)}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Load more */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-gray-50 transition-colors"
          >
            Load more ({filteredJobs.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Result count */}
      {!isLoading && filteredJobs.length > 0 && (
        <p className="text-xs text-neutral-400 text-center mt-4">
          Showing {Math.min(visibleCount, filteredJobs.length)} of {filteredJobs.length} jobs
        </p>
      )}

      <CreateJobModal
        open={showCreateJob}
        onClose={() => setShowCreateJob(false)}
      />
    </div>
  );
}
