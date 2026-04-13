import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { format, addDays, subDays, startOfDay, isToday } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
} from 'lucide-react';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-status-scheduled', label: 'Scheduled' },
  EN_ROUTE: { bg: 'bg-amber-100', text: 'text-warning', label: 'En Route' },
  IN_PROGRESS: { bg: 'bg-cyan-100', text: 'text-status-inProgress', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-status-completed', label: 'Completed' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] || STATUS_BADGE.SCHEDULED;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
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

export function SchedulePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [showCreateJob, setShowCreateJob] = useState(false);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const { data: rawJobs, isLoading } = useQuery({
    queryKey: ['jobs', dateKey],
    queryFn: () => api.getTodaysJobs(undefined, 'today', dateKey),
  });

  const jobs = rawJobs?.data || rawJobs || [];
  const jobList = Array.isArray(jobs) ? jobs : [];

  const goBack = () => setSelectedDate((d) => subDays(d, 1));
  const goForward = () => setSelectedDate((d) => addDays(d, 1));
  const goToday = () => setSelectedDate(startOfDay(new Date()));

  const todaySelected = isToday(selectedDate);

  const formatTime = (iso: string | undefined) => {
    if (!iso) return '';
    return format(new Date(iso), 'h:mm a');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto relative min-h-full">
      {/* Date header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {todaySelected ? 'Today' : format(selectedDate, 'EEEE')}
          <span className="text-neutral-400 font-normal"> &mdash; </span>
          <span className="font-semibold text-neutral-700">
            {format(selectedDate, 'EEEE, MMMM d')}
          </span>
        </h1>
      </div>

      {/* Day navigator */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={goBack}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-neutral-700">
          <CalendarDays className="w-4 h-4 text-neutral-400" />
          {format(selectedDate, 'MMM d, yyyy')}
        </div>

        <button
          type="button"
          onClick={goForward}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Next day"
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

        <div className="ml-auto text-sm text-neutral-400">
          {jobList.length} job{jobList.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : jobList.length === 0 ? (
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
          jobList.map((job: any) => {
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
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-200 transition-all group"
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
