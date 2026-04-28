import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSafeBack } from '../../hooks/useSafeBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  MapPin,
  FileText,
  Camera,
  Trash2,
  ChevronRight,
  Pencil,
  Plus,
  AlertTriangle,
  CheckCircle,
  Truck,
  CalendarDays,
  DollarSign,
  Copy,
  Loader2,
  Pause,
  Play,
  Save,
  Timer as TimerIcon,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { startTimer, stopTimer, getTimer, getElapsedSync, formatElapsed } from '../../lib/jobTimer';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';
import { EditableLineItems } from '../../components/jobs/EditableLineItems';
import { useToast } from '../../components/ui/Toast';

const STATUS_FLOW = ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'] as const;
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};
const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-status-scheduled' },
  EN_ROUTE: { bg: 'bg-amber-100', text: 'text-warning' },
  IN_PROGRESS: { bg: 'bg-cyan-100', text: 'text-status-inProgress' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-status-completed' },
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  SCHEDULED: CalendarDays,
  EN_ROUTE: Truck,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

function Section({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeBack = useSafeBack('/dashboard/jobs');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch job
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.getJob(id!),
    enabled: !!id,
  });

  // Fetch photos
  const { data: photosData } = useQuery({
    queryKey: ['job-photos', id],
    queryFn: () => api.getJobPhotos(id!),
    enabled: !!id,
  });

  // Fetch invoices for this job
  const { data: invoicesData } = useQuery({
    queryKey: ['job-invoices', id],
    queryFn: () => api.getInvoicesByJob(id!),
    enabled: !!id,
  });

  const job = jobData?.data || jobData;
  const photos = photosData?.data || [];
  const invoices = invoicesData?.data || [];

  // Create invoice modal
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  // Notes editing
  const [notes, setNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  useEffect(() => {
    if (job && !notesInitialized) {
      setNotes(job.notes || '');
      setNotesInitialized(true);
    }
  }, [job, notesInitialized]);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { status: newStatus };
      if (newStatus === 'IN_PROGRESS') updates.started_at = new Date().toISOString();
      if (newStatus === 'COMPLETED') updates.completed_at = new Date().toISOString();
      return api.updateJob(id!, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      addToast('Status updated', 'success');
    },
    onError: (err: any) => addToast(err.message || 'Failed to update status', 'error'),
  });

  // Notes mutation
  const notesMutation = useMutation({
    mutationFn: (newNotes: string) => api.updateJob(id!, { notes: newNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err: any) => addToast(err.message || 'Failed to save notes', 'error'),
  });
  // Auto-dismiss the "Saved" indicator after 2s so it doesn't linger forever.
  useEffect(() => {
    if (!notesMutation.isSuccess) return;
    const t = setTimeout(() => notesMutation.reset(), 2000);
    return () => clearTimeout(t);
  }, [notesMutation.isSuccess]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      addToast('Job deleted', 'success');
      navigate('/dashboard/schedule');
    },
    onError: (err: any) => addToast(err.message || 'Failed to delete job', 'error'),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: () => api.duplicateJob(job),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      addToast('Job duplicated', 'success');
      const newId = result?.data?.id;
      if (newId) navigate(`/dashboard/jobs/${newId}`);
    },
    onError: (err: any) => addToast(err.message || 'Failed to duplicate job', 'error'),
  });

  // Schedule editing
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');

  const initScheduleEdit = () => {
    const startIso = job?.scheduledStart || job?.scheduled_start;
    const endIso = job?.scheduledEnd || job?.scheduled_end;
    if (startIso) {
      const d = new Date(startIso);
      setScheduleDate(format(d, 'yyyy-MM-dd'));
      setScheduleStartTime(format(d, 'HH:mm'));
    } else {
      setScheduleDate('');
      setScheduleStartTime('');
    }
    if (endIso) {
      setScheduleEndTime(format(new Date(endIso), 'HH:mm'));
    } else {
      setScheduleEndTime('');
    }
    setEditingSchedule(true);
  };

  const scheduleMutation = useMutation({
    mutationFn: (updates: { scheduled_start: string; scheduled_end: string }) =>
      api.updateJob(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditingSchedule(false);
    },
    onError: (err: any) => addToast(err.message || 'Failed to update schedule', 'error'),
  });

  const handleScheduleSave = () => {
    if (!scheduleDate || !scheduleStartTime) return;
    const startStr = `${scheduleDate}T${scheduleStartTime}:00`;
    const endStr = scheduleEndTime ? `${scheduleDate}T${scheduleEndTime}:00` : `${scheduleDate}T${scheduleStartTime}:00`;
    // Guard against negative-duration jobs. When end time is provided, enforce
    // end > start. If end is omitted, we fall back to start=end (already handled above).
    if (scheduleEndTime) {
      const startMs = new Date(startStr).getTime();
      const endMs = new Date(endStr).getTime();
      if (endMs <= startMs) {
        addToast('End time must be after start time.', 'error');
        return;
      }
    }
    scheduleMutation.mutate({
      scheduled_start: new Date(startStr).toISOString(),
      scheduled_end: new Date(endStr).toISOString(),
    });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const currentStatusIdx = STATUS_FLOW.indexOf(job?.status as any);
  const canAdvance = currentStatusIdx >= 0 && currentStatusIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentStatusIdx + 1] : null;

  const customerName = job
    ? [job.customer?.firstName, job.customer?.lastName].filter(Boolean).join(' ') ||
      'Unknown Customer'
    : '';
  const address = job?.property
    ? [job.property.street || job.property.address, job.property.city, job.property.state]
        .filter(Boolean)
        .join(', ')
    : '';

  const lineItems: any[] = job?.lineItems || [];
  const lineItemsTotal = lineItems.reduce(
    (sum: number, li: any) => sum + (li.quantity || 1) * (li.unitPrice || li.unit_price || 0),
    0,
  );

  const formatDateTime = (iso: string | undefined) => {
    if (!iso) return '-';
    return format(new Date(iso), 'EEEE, MMM d, yyyy');
  };

  const formatTime = (iso: string | undefined) => {
    if (!iso) return '';
    return format(new Date(iso), 'h:mm a');
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-32 dark:bg-white/10" />
          <div className="h-8 bg-gray-200 rounded w-64 dark:bg-white/10" />
          <div className="h-40 bg-gray-100 rounded-xl dark:bg-white/10" />
          <div className="h-40 bg-gray-100 rounded-xl dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-neutral-500 dark:text-gray-400">Job not found</p>
          <Link
            to="/dashboard/schedule"
            className="text-sm text-brand-500 hover:text-brand-600 mt-2 inline-block dark:text-blue-300"
          >
            Back to schedule
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={safeBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors dark:text-gray-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{customerName}</h1>
        {address && (
          <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5 dark:text-gray-400">
            <MapPin className="w-4 h-4 text-neutral-400 dark:text-gray-500" />
            {address}
          </p>
        )}
        {job.description && (
          <p className="text-sm text-neutral-400 mt-1 dark:text-gray-500">{job.description}</p>
        )}
      </div>

      {/* Status section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Status</h2>
          {(() => {
            const cfg = STATUS_BADGE[job.status] || STATUS_BADGE.SCHEDULED;
            const Icon = STATUS_ICONS[job.status] || CalendarDays;
            return (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}
              >
                <Icon className="w-4 h-4" />
                {STATUS_LABELS[job.status] || job.status}
              </span>
            );
          })()}
        </div>

        {/* Status flow buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FLOW.map((s, idx) => {
            const isCurrent = job.status === s;
            const isPast = idx < currentStatusIdx;
            const isNext = s === nextStatus;
            const StIcon = STATUS_ICONS[s] || CalendarDays;

            return (
              <button
                key={s}
                type="button"
                disabled={!isNext}
                onClick={() => isNext && statusMutation.mutate(s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-brand-500 text-white'
                    : isPast
                      ? 'bg-gray-100 text-neutral-400'
                      : isNext
                        ? 'bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200'
                        : 'bg-gray-50 text-neutral-300 cursor-not-allowed'
                } dark:text-blue-300`}
              >
                <StIcon className="w-3.5 h-3.5" />
                {STATUS_LABELS[s]}
                {idx < STATUS_FLOW.length - 1 && (
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
        {statusMutation.isPending && (
          <p className="text-xs text-neutral-400 mt-2 dark:text-gray-500">Updating status...</p>
        )}
      </div>

      {/* Job timer — visible when in progress or any time has been logged.
          Mirrors mobile (apps/mobile/app/job/[id].tsx:653-672). Persists in
          localStorage, ticks every second while running, survives navigation
          inside the session. Tradesperson on web can clock the same job a
          mobile teammate is also running — separate timers per surface. */}
      <JobTimerCard jobId={id!} status={job.status} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule section */}
        <Section
          title="Schedule"
          icon={Clock}
          action={
            !editingSchedule ? (
              <button
                type="button"
                onClick={initScheduleEdit}
                className="p-2.5 -m-1 rounded-md hover:bg-gray-100 text-neutral-400 hover:text-neutral-600 transition-colors dark:hover:bg-white/10 dark:text-gray-500"
                aria-label="Edit schedule"
              >
                <Pencil className="w-4 h-4" />
              </button>
            ) : undefined
          }
        >
          {editingSchedule ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-wider mb-1 block dark:text-gray-500">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wider mb-1 block dark:text-gray-500">Start Time</label>
                  <input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 uppercase tracking-wider mb-1 block dark:text-gray-500">End Time</label>
                  <input
                    type="time"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:border-white/10 dark:focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScheduleSave}
                  disabled={scheduleMutation.isPending || !scheduleDate || !scheduleStartTime}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
                >
                  {scheduleMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSchedule(false)}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-100 transition dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 dark:text-gray-500">Date</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {formatDateTime(job.scheduledStart || job.scheduled_start)}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 dark:text-gray-500">Start</p>
                  <p className="text-sm font-medium text-neutral-700 dark:text-gray-200">
                    {formatTime(job.scheduledStart || job.scheduled_start) || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 dark:text-gray-500">End</p>
                  <p className="text-sm font-medium text-neutral-700 dark:text-gray-200">
                    {formatTime(job.scheduledEnd || job.scheduled_end) || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Invoice section */}
        <Section title="Invoices" icon={DollarSign}>
          {Array.isArray(invoices) && invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  to={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors dark:border-white/10 dark:hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      Invoice #{inv.invoiceNumber || inv.invoice_number || '-'}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-gray-500">
                      {inv.status?.toUpperCase() || 'DRAFT'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-700 dark:text-gray-200">
                      {formatCurrency(Number(inv.total || 0))}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-400 mb-3 dark:text-gray-500">No invoices for this job yet.</p>
              <button
                type="button"
                onClick={() => setShowCreateInvoice(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors dark:bg-blue-500/10 dark:text-blue-300"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          )}
        </Section>
      </div>

      {/* Line items table */}
      <Section title="Line Items" icon={FileText}>
        <EditableLineItems
          jobId={id!}
          initialItems={lineItems}
          onSave={() => queryClient.invalidateQueries({ queryKey: ['job', id] })}
        />
      </Section>

      {/* Notes section */}
      <Section title="Notes" icon={FileText}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (job.notes || '')) {
              notesMutation.mutate(notes);
            }
          }}
          placeholder="Add notes about this job..."
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y dark:border-white/10 dark:text-gray-200 dark:focus:ring-blue-400"
        />
        {notesMutation.isPending && (
          <p className="text-xs text-neutral-400 mt-1 dark:text-gray-500">Saving...</p>
        )}
        {notesMutation.isSuccess && (
          <p className="text-xs text-status-completed mt-1">Saved</p>
        )}
      </Section>

      {/* Photos section — upload + view, mirroring the mobile capture flow.
          Mobile uses expo-image-picker; web uses a hidden <input type="file"
          accept="image/*"> which routes to the camera on iOS Safari /
          Chrome Android. Drop target lets desktop drag-and-drop too. */}
      <Section title="Photos" icon={Camera}>
        <PhotoGrid jobId={id!} photos={photos} />
      </Section>

      {/* Action buttons */}
      <div className="pt-4 pb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => duplicateMutation.mutate()}
          disabled={duplicateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
        >
          {duplicateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate Job'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-500/30 dark:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Job'}
        </button>
      </div>

      <CreateInvoiceModal
        open={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        prefillJobId={id}
        prefillCustomerId={job.customerId || job.customer_id}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

/* ─── Job photos: upload + view ─────────────────────────────────────────
//
// Mirrors the mobile capture flow — on phone browsers, the file input
// with `accept="image/*"` and `capture="environment"` opens the rear
// camera by default; desktop gets a normal file picker plus a drop
// target. Each upload calls api.uploadJobPhoto which writes to the
// shared `job-photos` Supabase bucket and inserts a `job_photos` row,
// so a photo taken on the truck shows up here, and one dropped here
// shows up on the truck.
*/

function PhotoGrid({ jobId, photos }: { jobId: string; photos: any[] }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; url: string } | null>(null);
  const list = Array.isArray(photos) ? photos : [];

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadJobPhoto(jobId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
    },
    onError: (err: any) => addToast(err?.message || 'Upload failed', 'error'),
  });

  const removePhoto = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => api.deleteJobPhoto(id, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-photos', jobId] });
      setPendingDelete(null);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Delete failed', 'error');
      setPendingDelete(null);
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      // Sequential rather than parallel — phones on cellular can't reliably
      // saturate Supabase storage with N concurrent uploads, and sequential
      // gives us predictable progress + clear error messages per file.
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          addToast(`Skipped ${file.name} — not an image`, 'error');
          continue;
        }
        await upload.mutateAsync(file);
      }
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer?.files ?? null);
  }

  return (
    <div className="space-y-3">
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {list.map((photo: any) => {
            const url = photo.url || photo.publicUrl || photo.public_url || photo.photoUrl || photo.photo_url;
            return (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10"
              >
                <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <img
                    src={url}
                    alt={photo.caption || 'Job photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </a>
                <button
                  type="button"
                  onClick={() => setPendingDelete({ id: photo.id, url })}
                  title="Delete photo"
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          uploading
            ? 'border-brand-300 bg-brand-50/40 dark:bg-blue-500/10'
            : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/40 dark:border-white/10 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          // capture="environment" routes to rear camera on iOS Safari /
          // Chrome Android; desktop browsers ignore it and show the normal
          // file picker — best of both worlds, no UA sniffing.
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Reset value so re-uploading the same file fires onChange again.
            e.currentTarget.value = '';
          }}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            <span className="text-sm text-brand-700 dark:text-blue-300">Uploading…</span>
          </>
        ) : (
          <>
            <Camera className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Take photo or drop image
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              JPG, PNG — multiple at once OK
            </span>
          </>
        )}
      </label>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete photo"
        message="Remove this photo from the job? This can't be undone."
        variant="danger"
        confirmLabel="Delete"
        loading={removePhoto.isPending}
        onConfirm={() => pendingDelete && removePhoto.mutate(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/* ─── Job timer card ────────────────────────────────────────────────────
//
// Surfaces the persistent timer from lib/jobTimer.ts. Visible when:
//   • Job status is IN_PROGRESS, OR
//   • A timer with non-zero elapsed exists (so a paused timer still shows)
// While running, ticks the displayed elapsed every second. Play/Pause
// toggles via startTimer/stopTimer. The accumulated seconds persist in
// localStorage so navigation back to the job restores the same timer.
//
// Same UX rhythm mobile uses: timer display + single play/pause button +
// labor-hours breakdown so the tradesperson can see "3:45:21 = 3.76hr."
*/

function JobTimerCard({ jobId, status }: { jobId: string; status?: string }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Hydrate from storage on mount.
  useEffect(() => {
    const entry = getTimer(jobId);
    if (entry) {
      setRunning(entry.isRunning);
      setElapsed(getElapsedSync(entry));
    }
  }, [jobId]);

  // Tick while running. Stop interval when paused.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const entry = getTimer(jobId);
      if (entry) setElapsed(getElapsedSync(entry));
    }, 1000);
    return () => clearInterval(id);
  }, [running, jobId]);

  // Auto-start when the job transitions to IN_PROGRESS and there's no
  // existing timer (matches mobile behavior — clocks-in on status change).
  useEffect(() => {
    if (status !== 'IN_PROGRESS') return;
    const entry = getTimer(jobId);
    if (!entry || (!entry.isRunning && entry.elapsed === 0)) {
      startTimer(jobId);
      setRunning(true);
    }
  }, [status, jobId]);

  // Don't render when there's nothing to show: not in progress and no
  // accumulated time. Avoids a permanent "00:00:00" card on every job.
  const visible = status === 'IN_PROGRESS' || running || elapsed > 0;
  if (!visible) return null;

  function toggle() {
    if (running) {
      stopTimer(jobId);
      setRunning(false);
    } else {
      startTimer(jobId);
      setRunning(true);
    }
  }

  const hours = elapsed / 3600;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4 dark:bg-white/5 dark:border-white/10">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${running ? 'bg-brand-100 dark:bg-blue-500/20' : 'bg-neutral-100 dark:bg-white/10'}`}>
        <TimerIcon className={`w-5 h-5 ${running ? 'text-brand-600 dark:text-blue-300' : 'text-neutral-500 dark:text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-2xl font-bold tabular-nums leading-none ${running ? 'text-brand-700 dark:text-blue-200' : 'text-neutral-800 dark:text-white'}`}>
          {formatElapsed(elapsed)}
        </p>
        <p className="text-xs text-neutral-500 mt-1 dark:text-gray-400">
          {running ? 'Running' : 'Paused'} &middot; {hours.toFixed(2)} hrs
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        title={running ? 'Pause timer' : 'Start timer'}
        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors flex-shrink-0 ${
          running
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-brand-500 hover:bg-brand-600 text-white'
        }`}
      >
        {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
    </div>
  );
}
