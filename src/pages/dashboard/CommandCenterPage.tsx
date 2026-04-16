import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { JOB_STATUS_BADGE } from '../../lib/constants';
import { useProfile } from '../../hooks/useProfile';
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
  HardHat,
  MapPin,
  Star,
  X,
  ArrowRight,
  Zap,
  Users,
} from 'lucide-react';
import { CreateGCProjectModal } from '../../components/gc/CreateGCProjectModal';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';
import { CreateJobModal } from '../../components/jobs/CreateJobModal';
import { SetupChecklist } from '../../components/dashboard/SetupChecklist';
import { SpotlightTip } from '../../components/ui/SpotlightTip';
import { isOverdue as isInvoiceOverdue } from '../../lib/invoiceStatus';

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

// JOB_STATUS_BADGE imported from constants

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
  return <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />;
}

function SectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 dark:backdrop-blur-sm">
      <SkeletonBar className="h-4 w-32" />
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-3/4" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function CommandCenterPage() {
  const { isGC, isSub, isSolo, hasPriority, profile } = useProfile();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

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

  const { data: invitedData, isLoading: loadingInvited } = useQuery({
    queryKey: ['invited-projects'],
    queryFn: () => api.getInvitedProjects(),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  const { data: allJobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => api.getTodaysJobs(undefined, 'all'),
  });

  const projects = projectsData?.data || [];
  const todaysJobs = jobsData?.data || [];
  const invoices = invoicesData?.data || [];
  const settings = settingsData?.data;
  const invitedProjects: any[] = invitedData?.data || [];
  const allCustomers: any[] = customersData?.data || [];
  const allJobs: any[] = allJobsData?.data || [];

  const isLoading = loadingProjects || loadingJobs || loadingInvoices || loadingSettings || loadingInvited;

  // ── Computed values ──────────────────────────────────────────────

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv: any) => isInvoiceOverdue(inv, now));
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

  // Urgent GC project banners (safety, schedule categories)
  const urgentBanners = useMemo(() => {
    const items: { id: string; projectName: string; text: string }[] = [];
    for (const proj of invitedProjects) {
      const messages = (proj.messages || [])
        .filter((m: any) => !m.tradeId)
        .sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
      const latest = messages[0];
      if (!latest) continue;
      const msg: string = latest.message || '';
      const colonIdx = msg.indexOf(':');
      let category = '';
      let text = msg;
      if (colonIdx > 0 && colonIdx < 20) {
        category = msg.substring(0, colonIdx).toLowerCase();
        text = msg.substring(colonIdx + 1).trim();
      }
      if (category === 'safety' || category === 'schedule') {
        items.push({
          id: latest.id,
          projectName: proj.name || proj.projectName || 'Project',
          text,
        });
      }
    }
    return items;
  }, [invitedProjects]);

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
    <div className="relative p-4 lg:p-6 max-w-5xl mx-auto space-y-6 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-[radial-gradient(circle_at_70%_10%,rgba(59,130,246,0.12),transparent_55%)] dark:before:-z-10">
      {/* 0. Urgent GC Project Banners */}
      {urgentBanners.filter((b) => !dismissedBanners.has(b.id)).length > 0 && (
        <div className="space-y-2">
          {urgentBanners
            .filter((b) => !dismissedBanners.has(b.id))
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-500/10 dark:border-amber-500/30"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 dark:text-amber-300" />
                <span className="text-sm text-amber-800 flex-1 dark:text-amber-200">
                  <span className="font-semibold">{b.projectName}:</span> {b.text}
                </span>
                <button
                  type="button"
                  onClick={() => setDismissedBanners((prev) => new Set([...prev, b.id]))}
                  className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* 1. Welcome Header */}
      <div className="bg-gradient-to-r from-brand-500/5 via-brand-500/[0.02] to-transparent dark:from-brand-500/10 dark:via-brand-500/5 dark:to-transparent rounded-2xl p-6 mb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
              {greeting}, {settings?.business_name || profile?.business_name || 'there'}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-gray-400">
              {formattedDate}
              {profile?.trade && <span className="ml-2 text-brand-500 font-medium dark:text-blue-300">· {profile.trade}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 border-l-2 border-blue-500 dark:bg-blue-500/10 dark:text-blue-300">
                <Building2 className="w-3.5 h-3.5" />
                {projects.length} active project{projects.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 ring-1 ring-inset ring-green-500/20 border-l-2 border-green-500 dark:bg-green-500/10 dark:text-green-300">
              <Calendar className="w-3.5 h-3.5" />
              {todaysJobs.length} job{todaysJobs.length !== 1 ? 's' : ''} today
            </span>
            {overdueInvoices.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20 border-l-2 border-red-500 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle className="w-3.5 h-3.5" />
                {overdueInvoices.length} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1b. Setup Checklist — shown for new users */}
      <SetupChecklist
        customersCount={allCustomers.length}
        jobsCount={allJobs.length}
        sentInvoicesCount={invoices.filter((i: any) => i.status !== 'draft').length}
        scheduledJobsCount={allJobs.filter((j: any) => j.scheduledStart || j.scheduled_start).length}
        hasPhone={!!(settings?.phone || profile?.phone)}
        hasBusinessName={!!(settings?.business_name || profile?.business_name)}
      />

      {/* 1c. Smart Nudges — contextual prompts based on user state */}
      {(() => {
        const nudges: { id: string; icon: React.ElementType; color: string; message: string; cta: string; href?: string; onClick?: () => void }[] = [];

        // Has customers but no jobs
        if (allCustomers.length > 0 && allJobs.length === 0) {
          nudges.push({
            id: 'no-jobs',
            icon: Zap,
            color: 'brand',
            message: `You have ${allCustomers.length} customer${allCustomers.length > 1 ? 's' : ''} — ready to create your first job?`,
            cta: 'Create a Job',
            onClick: () => setShowNewJob(true),
          });
        }

        // Has completed jobs but no invoices
        const completedJobs = allJobs.filter((j: any) => j.status === 'COMPLETED');
        if (completedJobs.length > 0 && invoices.length === 0) {
          nudges.push({
            id: 'no-invoices',
            icon: FileText,
            color: 'emerald',
            message: `${completedJobs.length} completed job${completedJobs.length > 1 ? 's' : ''} without an invoice. Time to get paid!`,
            cta: 'Create Invoice',
            onClick: () => setShowNewInvoice(true),
          });
        }

        // Has jobs but none scheduled
        if (allJobs.length > 0 && allJobs.every((j: any) => !(j.scheduledStart || j.scheduled_start))) {
          nudges.push({
            id: 'no-schedule',
            icon: Calendar,
            color: 'cyan',
            message: 'Your jobs need dates! Schedule them so your crew knows where to be.',
            cta: 'Open Schedule',
            href: '/dashboard/schedule',
          });
        }

        // GC with no projects
        if (isGC && projects.length === 0) {
          nudges.push({
            id: 'no-projects',
            icon: Building2,
            color: 'violet',
            message: 'Set up your first project to start managing scopes, subs, and timelines.',
            cta: 'New Project',
            onClick: () => setShowNewProject(true),
          });
        }

        // Has invoices but none sent
        if (invoices.length > 0 && invoices.every((i: any) => i.status === 'draft')) {
          nudges.push({
            id: 'drafts-only',
            icon: DollarSign,
            color: 'amber',
            message: `You have ${invoices.length} draft invoice${invoices.length > 1 ? 's' : ''}. Send them to start collecting payments.`,
            cta: 'View Invoices',
            href: '/dashboard/invoices',
          });
        }

        if (nudges.length === 0) return null;

        // Show max 2 nudges
        const COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
          brand: { bg: 'bg-brand-50 dark:bg-brand-950/20', icon: 'text-brand-600 dark:text-brand-400', border: 'border-brand-100 dark:border-brand-900/40' },
          emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/40' },
          cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', icon: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-900/40' },
          violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/40' },
          amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/40' },
        };

        return (
          <div className="space-y-2">
            {nudges.slice(0, 2).map((n) => {
              const Icon = n.icon;
              const colors = COLOR_MAP[n.color] || COLOR_MAP.brand;
              const inner = (
                <div key={n.id} className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border ${colors.bg} ${colors.border} group cursor-pointer hover:shadow-md transition-all`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.bg} shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.icon} whitespace-nowrap group-hover:gap-2 transition-all`}>
                    {n.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
              if (n.href) {
                return <Link key={n.id} to={n.href}>{inner}</Link>;
              }
              return <button key={n.id} type="button" onClick={n.onClick} className="w-full text-left">{inner}</button>;
            })}
          </div>
        );
      })()}

      {/* 2. Active Projects Strip — GCs and 'both' see this prominently */}
      {projects.length > 0 && isGC && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Active Projects</h2>
            <Link to="/dashboard/projects" className="text-xs text-brand-600 font-medium hover:underline dark:text-blue-300">
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
                  className="shrink-0 w-52 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200 dark:backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {p.name || p.projectName || p.project_name}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-brand-500 dark:bg-blue-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
              className="shrink-0 w-52 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors dark:backdrop-blur-sm dark:text-gray-500"
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
              <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{a.message}</span>
                <Link to={a.link} className="ml-auto text-xs text-red-600 font-medium whitespace-nowrap dark:text-red-300">
                  View <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-300">All clear -- you're on track</span>
          </div>
        )}
      </section>

      {/* 3b. Your GC Projects (sub view) — only for subs/both */}
      {invitedProjects.length > 0 && isSub && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Your GC Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitedProjects.map((proj: any) => {
              const projName = proj.name || proj.projectName || 'Untitled Project';
              const projAddress = proj.address || proj.siteAddress || '';
              const gcName = proj.gcCompanyName || null;
              const trades = (proj.trades || []) as any[];
              // Compute task progress across all trades assigned to this user
              const allTasks = trades.flatMap((t: any) => t.tasks || []);
              const totalTasks = allTasks.length;
              const completeTasks = allTasks.filter(
                (tk: any) => tk.status === 'COMPLETED' || tk.status === 'completed' || tk.done
              ).length;
              // Latest banner message (project-level, no tradeId)
              const messages = (proj.messages || [])
                .filter((m: any) => !m.tradeId)
                .sort(
                  (a: any, b: any) =>
                    new Date(b.createdAt || b.created_at || 0).getTime() -
                    new Date(a.createdAt || a.created_at || 0).getTime()
                );
              const latestBanner = messages[0] || null;
              let bannerCategory = '';
              let bannerText = '';
              if (latestBanner) {
                const msg: string = latestBanner.message || '';
                const ci = msg.indexOf(':');
                if (ci > 0 && ci < 20) {
                  bannerCategory = msg.substring(0, ci).toLowerCase();
                  bannerText = msg.substring(ci + 1).trim();
                } else {
                  bannerText = msg;
                }
              }
              const BANNER_COLORS: Record<string, string> = {
                safety: 'bg-red-50 text-red-700 border-red-200',
                schedule: 'bg-amber-50 text-amber-700 border-amber-200',
                change_order: 'bg-purple-50 text-purple-700 border-purple-200',
                milestone: 'bg-green-50 text-green-700 border-green-200',
              };
              const bannerStyle = BANNER_COLORS[bannerCategory] || 'bg-blue-50 text-blue-700 border-blue-200';

              // Trade status badges
              const TRADE_STATUS: Record<string, { bg: string; text: string; label: string }> = {
                NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Started' },
                IN_PROGRESS: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'In Progress' },
                COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Complete' },
                BLOCKED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Blocked' },
              };

              return (
                <Link
                  key={proj.id}
                  to={`/dashboard/projects/assigned/${proj.id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden dark:backdrop-blur-sm"
                >
                  {/* Banner strip */}
                  {latestBanner && (
                    <div className={`px-4 py-2 text-xs font-medium border-b truncate ${bannerStyle}`}>
                      {bannerText}
                    </div>
                  )}

                  <div className="p-4">
                    {/* Project name + GC */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 dark:bg-blue-500/10">
                            <HardHat className="w-4 h-4 text-brand-600 dark:text-blue-300" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-white">{projName}</h3>
                            {gcName && (
                              <p className="text-xs text-gray-500 truncate dark:text-gray-400">{gcName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-2" />
                    </div>

                    {/* Address */}
                    {projAddress && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0 dark:text-gray-500" />
                        <span className="text-xs text-gray-500 truncate dark:text-gray-400">{projAddress}</span>
                      </div>
                    )}

                    {/* Trades */}
                    {trades.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {trades.map((t: any) => {
                          const st = TRADE_STATUS[t.status] || TRADE_STATUS.NOT_STARTED;
                          return (
                            <span
                              key={t.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${st.bg} ${st.text}`}
                            >
                              {t.trade || t.name || 'Trade'} -- {st.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Task progress */}
                    {totalTasks > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {completeTasks} of {totalTasks} task{totalTasks !== 1 ? 's' : ''} complete
                          </span>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {Math.round((completeTasks / totalTasks) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 dark:bg-white/10">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(completeTasks / totalTasks) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Today's Schedule + 5. Financial Snapshot */}
      {/* If user's top priority is financial, give financials more space */}
      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 ${
        hasPriority('Invoicing & payments') || hasPriority('Tracking job costs') ? 'lg:[direction:rtl] [&>*]:lg:[direction:ltr]' : ''
      }`}>
        {/* Today's Schedule (3/5, or 2/5 if finance-first) */}
        <div className={`${
          hasPriority('Invoicing & payments') || hasPriority('Tracking job costs') ? 'lg:col-span-2' : 'lg:col-span-3'
        } bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Today's Schedule</h2>
            <Link to="/dashboard/schedule" className="text-xs text-brand-600 font-medium hover:underline dark:text-blue-300">
              View Full Schedule
            </Link>
          </div>
          {todaysJobs.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0 dark:text-gray-500" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">{customerName}</span>
                        {timeStr && <span className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</span>}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </Link>
                );
              })}
              {todaysJobs.length > 5 && (
                <div className="pt-3">
                  <Link to="/dashboard/schedule" className="text-xs text-brand-600 font-medium dark:text-blue-300">
                    +{todaysJobs.length - 5} more jobs
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">No jobs scheduled today</p>
              <button
                type="button"
                onClick={() => setShowNewJob(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors dark:text-blue-300 dark:bg-blue-500/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Job
              </button>
            </div>
          )}
        </div>

        {/* Financial Snapshot (2/5, or 3/5 if finance-first) */}
        <div className={`${
          hasPriority('Invoicing & payments') || hasPriority('Tracking job costs') ? 'lg:col-span-3' : 'lg:col-span-2'
        } space-y-4`}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCurrency(financials.outstandingTotal)}</p>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {financials.outstandingCount} unpaid invoice{financials.outstandingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCurrency(financials.monthRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              {financials.monthPaidCount} paid invoice{financials.monthPaidCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 5b. FlowBoss Score teaser for subs */}
      {isSub && (
        <Link
          to="/dashboard/settings"
          className="flex items-center gap-4 bg-gradient-to-r from-amber-50 via-white to-white rounded-xl border border-amber-200/60 p-4 hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm shadow-amber-400/20 shrink-0 dark:shadow-black/30">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your FlowBoss Score</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Build your reputation across GC projects. View your score and project history.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
        </Link>
      )}

      {/* 6. Quick Actions — personalized by role */}
      <section>
        <SpotlightTip
          tipId="home-quick-actions"
          title="Your shortcuts"
          message="Jump straight to creating jobs, invoices, or projects. These adapt based on your role."
          position="top"
          delay={1500}
        >
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Quick Actions</h2>
        </SpotlightTip>
        <div className={`grid gap-3 ${isGC ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {/* GC: New Project button */}
          {isGC && (
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/20 dark:shadow-black/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Project</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewInvoice(true)}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/20 dark:shadow-black/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewJob(true)}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm shadow-violet-500/20 dark:shadow-black/30">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Job</span>
          </button>
          {/* Sub: View Schedule as prominent action */}
          {isSub && !isGC && (
            <Link
              to="/dashboard/schedule"
              className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-100 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm shadow-cyan-500/20 dark:shadow-black/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Schedule</span>
            </Link>
          )}
        </div>
      </section>

      {/* Modals */}
      <CreateGCProjectModal open={showNewProject} onClose={() => setShowNewProject(false)} />
      <CreateInvoiceModal open={showNewInvoice} onClose={() => setShowNewInvoice(false)} />
      <CreateJobModal open={showNewJob} onClose={() => setShowNewJob(false)} />
    </div>
  );
}
