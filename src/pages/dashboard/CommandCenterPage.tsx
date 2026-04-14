import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { format, parseISO, isBefore, startOfMonth } from 'date-fns';
import {
  Calendar,
  DollarSign,
  AlertCircle,
  Plus,
  Briefcase,
  FileText,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { CreateGCProjectModal } from '../../components/gc/CreateGCProjectModal';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';

// ── Helpers ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const todayStr = format(new Date(), 'yyyy-MM-dd');

const JOB_STATUS_BADGE: Record<string, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/20', dot: 'bg-blue-500', label: 'Scheduled' },
  EN_ROUTE: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/20', dot: 'bg-amber-500', label: 'En Route' },
  IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-500/20', dot: 'bg-cyan-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-500/20', dot: 'bg-green-500', label: 'Completed' },
};

const PROJECT_STATUS_DOT: Record<string, string> = {
  NOT_STARTED: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = JOB_STATUS_BADGE[status] || JOB_STATUS_BADGE.SCHEDULED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Skeleton Components ──────────────────────────────────────────────

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

function SectionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <SkeletonBar className="h-4 w-32" />
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-3/4" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function CommandCenterPage() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);

  // Data queries
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['gc-projects'],
    queryFn: () => api.getGCProjects(),
  });

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', todayStr],
    queryFn: () => api.getTodaysJobs(undefined, 'today'),
  });

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const projects = projectsData?.data || [];
  const todaysJobs = jobsData?.data || [];
  const invoices = invoicesData?.data || [];
  const settings = settingsData?.data;

  const isLoading = loadingProjects || loadingJobs || loadingInvoices || loadingSettings;

  // ── Computed values ──────────────────────────────────────────────

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv: any) => {
      if (inv.status === 'overdue') return true;
      if (inv.status === 'paid') return false;
      const due = inv.dueDate || inv.due_date;
      return due && isBefore(parseISO(due), now);
    });
  }, [invoices]);

  const alerts = useMemo(() => {
    const items: { id: string; message: string; link: string }[] = [];

    // Overdue invoices
    if (overdueInvoices.length > 0) {
      items.push({
        id: 'overdue-invoices',
        message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue`,
        link: '/dashboard/invoices',
      });
    }

    // Jobs still scheduled past start time
    const now = new Date();
    const lateJobs = todaysJobs.filter((j: any) => {
      if (j.status !== 'SCHEDULED') return false;
      const start = j.scheduledStart || j.scheduled_start;
      return start && isBefore(parseISO(start), now);
    });
    if (lateJobs.length > 0) {
      items.push({
        id: 'late-jobs',
        message: `${lateJobs.length} job${lateJobs.length > 1 ? 's' : ''} still scheduled past start time`,
        link: '/dashboard/jobs',
      });
    }

    // Over-budget projects
    const overBudget = projects.filter((p: any) => {
      const trades = p.trades || [];
      return trades.some((t: any) => {
        const budget =
          (t.laborHours || t.labor_hours || 0) * (t.laborRate || t.labor_rate || 0) +
          (t.materialsBudget || t.materials_budget || 0);
        const spent = (t.actualLabor || t.actual_labor || 0) + (t.actualMaterials || t.actual_materials || 0);
        return budget > 0 && spent > budget;
      });
    });
    if (overBudget.length > 0) {
      items.push({
        id: 'over-budget',
        message: `${overBudget.length} project${overBudget.length > 1 ? 's' : ''} over budget`,
        link: '/dashboard/projects',
      });
    }

    return items;
  }, [overdueInvoices, todaysJobs, projects]);

  const financials = useMemo(() => {
    const unpaid = invoices.filter((i: any) => i.status !== 'paid' && i.status !== 'draft');
    const outstandingTotal = unpaid.reduce((sum: number, i: any) => sum + (i.total || i.amount || 0), 0);

    const monthStart = startOfMonth(new Date());
    const paidThisMonth = invoices.filter((i: any) => {
      if (i.status !== 'paid') return false;
      const paidAt = i.paidAt || i.paid_at || i.updatedAt || i.updated_at;
      return paidAt && !isBefore(parseISO(paidAt), monthStart);
    });
    const monthRevenue = paidThisMonth.reduce((sum: number, i: any) => sum + (i.total || i.amount || 0), 0);

    return { outstandingTotal, outstandingCount: unpaid.length, monthRevenue, monthPaidCount: paidThisMonth.length };
  }, [invoices]);

  const greeting = getGreeting();
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  // ── Loading state ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <SkeletonBar className="h-7 w-64" />
          <SkeletonBar className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Welcome Header */}
      <div className="bg-gradient-to-r from-brand-500/5 via-brand-500/[0.02] to-transparent rounded-2xl p-6 mb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, {settings?.business_name || 'there'}
            </h1>
            <p className="text-sm text-neutral-500">{formattedDate}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 border-l-2 border-blue-500">
                <Building2 className="w-3.5 h-3.5" />
                {projects.length} active project{projects.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 ring-1 ring-inset ring-green-500/20 border-l-2 border-green-500">
              <Calendar className="w-3.5 h-3.5" />
              {todaysJobs.length} job{todaysJobs.length !== 1 ? 's' : ''} today
            </span>
            {overdueInvoices.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 border-l-2 border-red-500">
                <AlertCircle className="w-3.5 h-3.5" />
                {overdueInvoices.length} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Active Projects Strip */}
      {projects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Projects</h2>
            <Link to="/dashboard/projects" className="text-xs text-brand-600 font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {projects.slice(0, 8).map((p: any) => {
              const trades = p.trades || [];
              const totalBudget = trades.reduce((sum: number, t: any) => {
                return (
                  sum +
                  (t.laborHours || t.labor_hours || 0) * (t.laborRate || t.labor_rate || 0) +
                  (t.materialsBudget || t.materials_budget || 0)
                );
              }, 0);
              const totalSpent = trades.reduce((sum: number, t: any) => {
                return sum + (t.actualLabor || t.actual_labor || 0) + (t.actualMaterials || t.actual_materials || 0);
              }, 0);
              const remaining = totalBudget - totalSpent;
              const progress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
              const statusDot = PROJECT_STATUS_DOT[p.status] || PROJECT_STATUS_DOT.NOT_STARTED;

              return (
                <Link
                  key={p.id}
                  to={`/dashboard/projects/${p.id}`}
                  className="shrink-0 w-52 bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {p.name || p.projectName || p.project_name}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {totalBudget > 0
                      ? `${fmtCurrency(remaining)} remaining`
                      : `${trades.length} trade${trades.length !== 1 ? 's' : ''}`}
                  </p>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="shrink-0 w-52 bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">New Project</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. Alerts & Action Items */}
      <section>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700">{a.message}</span>
                <Link to={a.link} className="ml-auto text-xs text-red-600 font-medium whitespace-nowrap">
                  View <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-700">All clear -- you're on track</span>
          </div>
        )}
      </section>

      {/* 4. Today's Schedule + 5. Financial Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Today's Schedule (3/5) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Today's Schedule</h2>
            <Link to="/dashboard/schedule" className="text-xs text-brand-600 font-medium hover:underline">
              View Full Schedule
            </Link>
          </div>
          {todaysJobs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {todaysJobs.slice(0, 5).map((job: any) => {
                const customer = job.customer;
                const customerName = customer
                  ? `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim()
                  : 'Unnamed';
                const start = job.scheduledStart || job.scheduled_start;
                const timeStr = start ? format(parseISO(start), 'h:mm a') : '';
                return (
                  <Link
                    key={job.id}
                    to={`/dashboard/jobs/${job.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">{customerName}</span>
                        {timeStr && <span className="text-xs text-gray-500">{timeStr}</span>}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </Link>
                );
              })}
              {todaysJobs.length > 5 && (
                <div className="pt-3">
                  <Link to="/dashboard/schedule" className="text-xs text-brand-600 font-medium">
                    +{todaysJobs.length - 5} more jobs
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No jobs scheduled today</p>
              <button
                type="button"
                onClick={() => setShowNewJob(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Job
              </button>
            </div>
          )}
        </div>

        {/* Financial Snapshot (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmtCurrency(financials.outstandingTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {financials.outstandingCount} unpaid invoice{financials.outstandingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmtCurrency(financials.monthRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {financials.monthPaidCount} paid invoice{financials.monthPaidCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setShowNewProject(true)}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">New Project</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewInvoice(true)}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Create Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewJob(true)}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm shadow-violet-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Job</span>
          </button>
        </div>
      </section>

      {/* Modals */}
      <CreateGCProjectModal open={showNewProject} onClose={() => setShowNewProject(false)} />
      <CreateInvoiceModal open={showNewInvoice} onClose={() => setShowNewInvoice(false)} />
      <CreateJobModal open={showNewJob} onClose={() => setShowNewJob(false)} />
    </div>
  );
}
